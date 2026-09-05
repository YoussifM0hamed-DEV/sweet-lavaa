import { Product, DeliveryZone, Setting } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { round2, effectiveUnitPrice } from '../utils/money.js';
import { validateCoupon } from './coupon.service.js';

/**
 * THE single source of truth for order money.
 *
 * Nothing the client submits about prices, discounts, delivery fees or totals is
 * trusted: every figure below is re-derived from the database on each request.
 */

/**
 * Turns raw cart items into priced lines, validating availability along the way.
 *
 * @param {Array} items  [{ product: id, quantity, variant }]
 * @param {object} options
 * @param {boolean} options.strict  Throw on unavailable items (checkout) instead
 *                                  of flagging them (cart view).
 */
export const priceCartItems = async (items = [], { strict = false } = {}) => {
  if (!items.length) return { lines: [], subtotal: 0, issues: [] };

  const productIds = items.map((item) => String(item.product?._id || item.product));
  const products = await Product.find({ _id: { $in: productIds } })
    .populate('category', 'name slug isActive')
    .lean({ virtuals: true });

  const productMap = new Map(products.map((product) => [String(product._id), product]));

  const lines = [];
  const issues = [];

  for (const item of items) {
    const productId = String(item.product?._id || item.product);
    const product = productMap.get(productId);

    const reject = (message, code) => {
      if (strict) throw ApiError.badRequest(message);
      issues.push({ product: productId, code, message });
    };

    if (!product) {
      reject('One of the items in your cart is no longer available.', 'not_found');
      continue;
    }
    if (!product.isActive) {
      reject(`"${product.name}" is currently unavailable.`, 'inactive');
      continue;
    }
    if (product.category && product.category.isActive === false) {
      reject(`"${product.name}" is currently unavailable.`, 'category_inactive');
      continue;
    }

    const quantity = Math.max(1, Math.min(99, Number(item.quantity) || 1));

    // Resolve the selected variant (if any) and its price modifier.
    let variant = null;
    if (item.variant?.id) {
      variant = (product.variants || []).find((entry) => String(entry._id) === String(item.variant.id)) || null;
      if (!variant) {
        reject(`The selected option for "${product.name}" is no longer available.`, 'variant_missing');
        continue;
      }
      if (variant.isAvailable === false) {
        reject(`"${variant.name}" of "${product.name}" is sold out.`, 'variant_unavailable');
        continue;
      }
    }

    if (product.trackInventory && product.stock <= 0) {
      reject(`"${product.name}" is out of stock.`, 'out_of_stock');
      continue;
    }
    if (product.trackInventory && product.stock < quantity) {
      reject(`Only ${product.stock} left of "${product.name}".`, 'insufficient_stock');
      continue;
    }

    const modifier = Number(variant?.priceModifier || 0);
    const unitPrice = round2(effectiveUnitPrice(product) + modifier);
    const originalPrice = round2(Number(product.price) + modifier);

    lines.push({
      product: product._id,
      name: product.name,
      slug: product.slug,
      image: (product.images?.find((image) => image.isPrimary) || product.images?.[0])?.url || '',
      category: product.category?._id || product.category || null,
      categoryName: product.category?.name || '',
      variant: variant ? { id: variant._id, name: variant.name } : { id: null, name: '' },
      unitPrice,
      originalPrice,
      quantity,
      lineTotal: round2(unitPrice * quantity),
      stock: product.stock,
      trackInventory: product.trackInventory,
    });
  }

  const subtotal = round2(lines.reduce((total, line) => total + line.lineTotal, 0));
  return { lines, subtotal, issues };
};

/** Resolves the delivery fee for a zone, honouring free-delivery thresholds. */
export const resolveDelivery = async (zoneId, subtotal) => {
  if (!zoneId) return null;

  const zone = await DeliveryZone.findById(zoneId).lean();
  if (!zone) throw ApiError.badRequest('The selected delivery area is not available.');
  if (!zone.isActive) throw ApiError.badRequest(`We are not delivering to ${zone.name} at the moment.`);
  if (zone.minimumOrderAmount > 0 && subtotal < zone.minimumOrderAmount) {
    throw ApiError.badRequest(`Orders to ${zone.name} start from ${zone.minimumOrderAmount} EGP.`);
  }

  const free = zone.freeDeliveryThreshold > 0 && subtotal >= zone.freeDeliveryThreshold;

  return {
    zone: zone._id,
    name: zone.name,
    fee: free ? 0 : round2(zone.deliveryFee),
    estimatedTime: zone.estimatedTime,
    isFree: free,
    freeDeliveryThreshold: zone.freeDeliveryThreshold,
  };
};

/**
 * Produces the full, authoritative money breakdown for a cart.
 * Used by the cart view, the checkout quote endpoint and order creation alike,
 * which guarantees the customer is charged exactly what they were shown.
 */
export const quoteCart = async ({ items, couponCode, deliveryZoneId, userId, strict = false }) => {
  const { lines, subtotal, issues } = await priceCartItems(items, { strict });
  const settings = await Setting.getSettings();

  let couponResult = null;
  let couponError = null;

  if (couponCode && lines.length) {
    if (strict) {
      couponResult = await validateCoupon({ code: couponCode, userId, subtotal, lines, throwOnFail: true });
    } else {
      try {
        couponResult = await validateCoupon({ code: couponCode, userId, subtotal, lines, throwOnFail: true });
      } catch (error) {
        couponError = error.message;
      }
    }
  }

  const discount = round2(couponResult?.discount || 0);

  let delivery = null;
  if (deliveryZoneId) delivery = await resolveDelivery(deliveryZoneId, subtotal);
  const deliveryFee = round2(delivery?.fee || 0);

  const taxable = round2(Math.max(0, subtotal - discount));
  const tax =
    settings.commerce.taxEnabled && !settings.commerce.taxIncludedInPrice
      ? round2((taxable * settings.commerce.taxRate) / 100)
      : 0;

  const total = round2(Math.max(0, taxable + deliveryFee + tax));

  return {
    lines,
    issues,
    coupon: couponResult
      ? {
          coupon: couponResult.coupon._id,
          code: couponResult.coupon.code,
          discountType: couponResult.coupon.discountType,
          discountValue: couponResult.coupon.discountValue,
        }
      : null,
    couponError,
    delivery,
    pricing: {
      subtotal,
      discount,
      deliveryFee,
      tax,
      total,
      currency: settings.commerce.currency || 'EGP',
    },
    settings: {
      minimumOrderAmount: settings.commerce.minimumOrderAmount,
      currency: settings.commerce.currency,
      allowCashOnDelivery: settings.commerce.allowCashOnDelivery,
    },
  };
};

export default { priceCartItems, resolveDelivery, quoteCart };

import { Cart, Product } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { quoteCart } from '../services/pricing.service.js';

const getOrCreateCart = async (userId) => {
  const cart = await Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { items: [] } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return cart;
};

/**
 * Builds the API response for a cart. Every price here comes from the pricing
 * service, never from stored values, so the numbers always reflect the
 * current catalogue.
 */
const buildCartResponse = async (cart, userId) => {
  const quote = await quoteCart({
    items: cart.items,
    couponCode: cart.couponCode,
    deliveryZoneId: cart.deliveryZone,
    userId,
    strict: false,
  });

  // Drop a coupon that has become invalid so the customer is not misled.
  if (cart.couponCode && !quote.coupon) {
    cart.couponCode = null;
    await cart.save();
  }

  return {
    id: cart._id,
    items: quote.lines.map((line) => ({
      product: line.product,
      name: line.name,
      slug: line.slug,
      image: line.image,
      categoryName: line.categoryName,
      variant: line.variant,
      unitPrice: line.unitPrice,
      originalPrice: line.originalPrice,
      quantity: line.quantity,
      lineTotal: line.lineTotal,
      stock: line.stock,
      trackInventory: line.trackInventory,
    })),
    itemsCount: quote.lines.reduce((total, line) => total + line.quantity, 0),
    issues: quote.issues,
    coupon: quote.coupon,
    couponError: quote.couponError,
    delivery: quote.delivery,
    pricing: quote.pricing,
    deliveryZone: cart.deliveryZone,
  };
};

export const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  return sendSuccess(res, { data: { cart: await buildCartResponse(cart, req.user._id) } });
});

export const addItem = asyncHandler(async (req, res) => {
  const { product: productId, quantity, variantId } = req.body;

  const product = await Product.findById(productId).populate('category', 'isActive');
  if (!product || !product.isActive) throw ApiError.notFound('This product is not available.');
  if (product.category && product.category.isActive === false) {
    throw ApiError.badRequest('This product is not available right now.');
  }

  let variantName = '';
  if (variantId) {
    const variant = product.variants.id(variantId);
    if (!variant || !variant.isAvailable) throw ApiError.badRequest('The selected option is not available.');
    variantName = variant.name;
  }

  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.findItem(productId, variantId);
  const nextQuantity = (existing?.quantity || 0) + quantity;

  if (product.trackInventory && product.stock < nextQuantity) {
    throw ApiError.badRequest(
      product.stock <= 0 ? `"${product.name}" is out of stock.` : `Only ${product.stock} left of "${product.name}".`,
    );
  }
  if (nextQuantity > 99) throw ApiError.badRequest('You can order up to 99 of a single item.');

  if (existing) {
    existing.quantity = nextQuantity;
  } else {
    cart.items.push({ product: productId, quantity, variant: { id: variantId || null, name: variantName } });
  }

  await cart.save();
  return sendSuccess(res, {
    message: `${product.name} added to your cart.`,
    data: { cart: await buildCartResponse(cart, req.user._id) },
  });
});

export const updateItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.findItem(req.params.productId, req.body.variantId);
  if (!item) throw ApiError.notFound('This item is not in your cart.');

  if (req.body.quantity === 0) {
    item.deleteOne();
  } else {
    const product = await Product.findById(req.params.productId).select('name stock trackInventory');
    if (product?.trackInventory && product.stock < req.body.quantity) {
      throw ApiError.badRequest(`Only ${product.stock} left of "${product.name}".`);
    }
    item.quantity = req.body.quantity;
  }

  await cart.save();
  return sendSuccess(res, { data: { cart: await buildCartResponse(cart, req.user._id) } });
});

export const removeItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.findItem(req.params.productId, req.query.variantId);
  if (!item) throw ApiError.notFound('This item is not in your cart.');

  item.deleteOne();
  await cart.save();

  return sendSuccess(res, { message: 'Item removed.', data: { cart: await buildCartResponse(cart, req.user._id) } });
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  cart.couponCode = null;
  await cart.save();

  return sendSuccess(res, { message: 'Your cart is empty.', data: { cart: await buildCartResponse(cart, req.user._id) } });
});

/**
 * Merges a guest (localStorage) cart into the server cart on sign-in.
 * Quantities are combined and clamped to available stock.
 */
export const mergeGuestCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const incoming = req.body.items || [];

  if (incoming.length) {
    const products = await Product.find({
      _id: { $in: incoming.map((item) => item.product) },
      isActive: true,
    }).select('name stock trackInventory variants');

    const productMap = new Map(products.map((product) => [String(product._id), product]));

    incoming.forEach((item) => {
      const product = productMap.get(String(item.product));
      if (!product) return;

      const existing = cart.findItem(item.product, item.variantId);
      const desired = (existing?.quantity || 0) + item.quantity;
      const capped = product.trackInventory ? Math.min(desired, product.stock) : Math.min(desired, 99);
      if (capped <= 0) return;

      if (existing) {
        existing.quantity = capped;
      } else {
        const variant = item.variantId ? product.variants.id(item.variantId) : null;
        cart.items.push({
          product: item.product,
          quantity: capped,
          variant: { id: variant?._id || null, name: variant?.name || '' },
        });
      }
    });

    await cart.save();
  }

  return sendSuccess(res, { data: { cart: await buildCartResponse(cart, req.user._id) } });
});

/** Stores the chosen coupon code. Validation happens inside the quote. */
export const applyCoupon = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  if (!cart.items.length) throw ApiError.badRequest('Add something sweet to your cart first.');

  const preview = await quoteCart({
    items: cart.items,
    couponCode: req.body.code,
    deliveryZoneId: cart.deliveryZone,
    userId: req.user._id,
    strict: true,
  });

  cart.couponCode = preview.coupon.code;
  await cart.save();

  return sendSuccess(res, {
    message: `Coupon ${preview.coupon.code} applied.`,
    data: { cart: await buildCartResponse(cart, req.user._id) },
  });
});

export const removeCoupon = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.couponCode = null;
  await cart.save();

  return sendSuccess(res, { message: 'Coupon removed.', data: { cart: await buildCartResponse(cart, req.user._id) } });
});

/**
 * Checkout quote: recalculates the full breakdown for a chosen delivery zone
 * and coupon. This is what the checkout summary renders — and the same
 * function order creation uses, so the customer is charged what they saw.
 */
export const getQuote = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  if (!cart.items.length) throw ApiError.badRequest('Your cart is empty.');

  if (req.body.deliveryZone !== undefined) cart.deliveryZone = req.body.deliveryZone || null;
  if (req.body.couponCode !== undefined) cart.couponCode = req.body.couponCode || null;
  await cart.save();

  const quote = await quoteCart({
    items: cart.items,
    couponCode: cart.couponCode,
    deliveryZoneId: cart.deliveryZone,
    userId: req.user._id,
    strict: false,
  });

  return sendSuccess(res, {
    data: {
      items: quote.lines,
      issues: quote.issues,
      coupon: quote.coupon,
      couponError: quote.couponError,
      delivery: quote.delivery,
      pricing: quote.pricing,
      settings: quote.settings,
    },
  });
});

export { getOrCreateCart, buildCartResponse };

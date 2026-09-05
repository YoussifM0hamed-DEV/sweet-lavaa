import { Order, Cart, User, Setting } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess, buildPaginationMeta } from '../utils/apiResponse.js';
import { quoteCart } from '../services/pricing.service.js';
import { recordCouponUsage, releaseCouponUsage } from '../services/coupon.service.js';
import { reserveStock, releaseStock } from '../services/inventory.service.js';
import { generateOrderNumber } from '../utils/orderNumber.js';
import { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHODS } from '../config/constants.js';

/**
 * Creates an order from the signed-in customer's cart.
 *
 * Everything financial is recomputed here from the database:
 * the request body carries only contact details, an address, a zone id, a
 * coupon code and a payment method — never prices or totals.
 */
export const createOrder = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || !cart.items.length) throw ApiError.badRequest('Your cart is empty.');

  const settings = await Setting.getSettings();

  if (req.body.paymentMethod === PAYMENT_METHODS.COD && !settings.commerce.allowCashOnDelivery) {
    throw ApiError.badRequest('Cash on delivery is not available at the moment.');
  }

  // strict: true makes unavailable / out-of-stock items reject the order.
  const quote = await quoteCart({
    items: cart.items,
    couponCode: req.body.couponCode ?? cart.couponCode,
    deliveryZoneId: req.body.deliveryZone,
    userId: req.user._id,
    strict: true,
  });

  if (!quote.lines.length) throw ApiError.badRequest('Your cart is empty.');

  if (settings.commerce.minimumOrderAmount > 0 && quote.pricing.subtotal < settings.commerce.minimumOrderAmount) {
    throw ApiError.badRequest(`The minimum order value is ${settings.commerce.minimumOrderAmount} EGP.`);
  }

  const items = quote.lines.map((line) => ({
    product: line.product,
    name: line.name,
    slug: line.slug,
    image: line.image,
    category: line.category,
    categoryName: line.categoryName,
    variant: line.variant,
    unitPrice: line.unitPrice,
    originalPrice: line.originalPrice,
    quantity: line.quantity,
    lineTotal: line.lineTotal,
  }));

  // Reserve stock before the order exists so two customers cannot buy the last one.
  await reserveStock(items);

  let order;
  try {
    order = await Order.create({
      orderNumber: generateOrderNumber(),
      user: req.user._id,
      items,
      contact: req.body.contact,
      shippingAddress: req.body.shippingAddress,
      deliveryZone: {
        zone: quote.delivery.zone,
        name: quote.delivery.name,
        fee: quote.delivery.fee,
        estimatedTime: quote.delivery.estimatedTime,
      },
      coupon: quote.coupon || { coupon: null, code: null, discountType: null, discountValue: 0 },
      pricing: quote.pricing,
      payment: {
        method: req.body.paymentMethod,
        status: PAYMENT_STATUS.PENDING,
        provider: req.body.paymentMethod === PAYMENT_METHODS.COD ? 'cash' : 'paymob',
      },
      status: ORDER_STATUS.PENDING,
      statusHistory: [{ status: ORDER_STATUS.PENDING, changedBy: req.user._id, note: 'Order placed.' }],
      inventoryApplied: true,
      customerNotes: req.body.customerNotes,
    });
  } catch (error) {
    // Never leave stock reserved for an order that failed to persist.
    await releaseStock(items);
    throw error;
  }

  if (quote.coupon?.coupon) await recordCouponUsage(quote.coupon.coupon, req.user._id);

  if (req.body.saveAddress) {
    const user = await User.findById(req.user._id);
    if (user.addresses.length < 10) {
      user.addresses.push({
        ...req.body.shippingAddress,
        label: 'Delivery address',
        fullName: req.body.contact.fullName,
        phone: req.body.contact.phone,
        deliveryZone: quote.delivery.zone,
        isDefault: user.addresses.length === 0,
      });
      await user.save();
    }
  }

  // Cash orders are confirmed straight away; card orders wait for Paymob.
  if (req.body.paymentMethod === PAYMENT_METHODS.COD) {
    order.status = ORDER_STATUS.CONFIRMED;
    order.pushStatus(ORDER_STATUS.CONFIRMED, req.user._id, 'Cash on delivery order confirmed.');
    await order.save();
  }

  cart.items = [];
  cart.couponCode = null;
  await cart.save();

  return sendSuccess(res, {
    status: 201,
    message: 'Your order has been placed.',
    data: { order, requiresPayment: req.body.paymentMethod !== PAYMENT_METHODS.COD },
  });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 10);

  const filter = { user: req.user._id };
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean({ virtuals: true }),
    Order.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: { orders }, meta: buildPaginationMeta({ page, limit, total }) });
});

export const getMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).lean({ virtuals: true });
  if (!order) throw ApiError.notFound('Order not found.');

  // A customer may only ever read their own orders.
  if (String(order.user) !== String(req.user._id)) throw ApiError.forbidden('You cannot view this order.');

  return sendSuccess(res, { data: { order } });
});

/** Look up an order by its human readable number (order tracking page). */
export const trackOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNumber: String(req.params.orderNumber).toUpperCase() })
    .select('orderNumber status statusHistory payment.status deliveryZone createdAt deliveredAt user pricing.total items')
    .lean({ virtuals: true });

  if (!order) throw ApiError.notFound('We could not find an order with that number.');
  if (String(order.user) !== String(req.user._id)) throw ApiError.forbidden('You cannot view this order.');

  return sendSuccess(res, { data: { order } });
});

const CANCELLABLE = [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED];

export const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found.');
  if (String(order.user) !== String(req.user._id)) throw ApiError.forbidden('You cannot modify this order.');

  if (!CANCELLABLE.includes(order.status)) {
    throw ApiError.badRequest('This order is already being prepared and can no longer be cancelled online.');
  }
  if (order.payment.status === PAYMENT_STATUS.PAID) {
    throw ApiError.badRequest('This order is already paid. Please contact support for a refund.');
  }

  if (order.inventoryApplied) {
    await releaseStock(order.items);
    order.inventoryApplied = false;
  }
  if (order.coupon?.coupon) await releaseCouponUsage(order.coupon.coupon, order.user);

  order.status = ORDER_STATUS.CANCELLED;
  order.cancelledAt = new Date();
  order.pushStatus(ORDER_STATUS.CANCELLED, req.user._id, req.body.reason || 'Cancelled by customer.');
  await order.save();

  return sendSuccess(res, { message: 'Your order has been cancelled.', data: { order } });
});

/** Products the customer has actually received — gates the review form. */
export const getReviewableProducts = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    user: req.user._id,
    status: ORDER_STATUS.DELIVERED,
  })
    .select('items.product items.name items.image createdAt')
    .lean();

  const seen = new Map();
  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (!seen.has(String(item.product))) {
        seen.set(String(item.product), { product: item.product, name: item.name, image: item.image });
      }
    });
  });

  return sendSuccess(res, { data: { products: [...seen.values()] } });
});

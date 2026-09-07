import { Order, User } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess, buildPaginationMeta } from '../utils/apiResponse.js';
import { escapeRegex } from '../utils/queryFeatures.js';
import { releaseStock } from '../services/inventory.service.js';
import { releaseCouponUsage } from '../services/coupon.service.js';
import { ORDER_STATUS, PAYMENT_STATUS } from '../config/constants.js';

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  'total-desc': { 'pricing.total': -1 },
  'total-asc': { 'pricing.total': 1 },
};

export const adminListOrders = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const { page, limit, sort } = query;

  const filter = {};
  if (query.status && query.status !== 'all') filter.status = query.status;
  if (query.paymentStatus && query.paymentStatus !== 'all') filter['payment.status'] = query.paymentStatus;
  if (query.zone) filter['deliveryZone.zone'] = query.zone;

  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) {
      const to = new Date(query.to);
      to.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = to;
    }
  }

  if (query.search) {
    const regex = { $regex: escapeRegex(query.search.trim()), $options: 'i' };
    filter.$or = [{ orderNumber: regex }, { 'contact.fullName': regex }, { 'contact.email': regex }, { 'contact.phone': regex }];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'firstName lastName email')
      .sort(SORTS[sort] || SORTS.newest)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean({ virtuals: true }),
    Order.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: { orders }, meta: buildPaginationMeta({ page, limit, total }) });
});

export const adminGetOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'firstName lastName email phone stats createdAt')
    .populate('statusHistory.changedBy', 'firstName lastName')
    .lean({ virtuals: true });

  if (!order) throw ApiError.notFound('Order not found.');
  return sendSuccess(res, { data: { order } });
});

/**
 * Status transitions. Cancelling returns stock and coupon usage; delivering
 * stamps the delivery date and refreshes the customer's lifetime stats.
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found.');

  const next = req.body.status;
  if (order.status === next) throw ApiError.badRequest('The order already has this status.');
  if (order.status === ORDER_STATUS.DELIVERED && next !== ORDER_STATUS.DELIVERED) {
    throw ApiError.badRequest('A delivered order cannot change status.');
  }

  if (next === ORDER_STATUS.CANCELLED) {
    if (order.inventoryApplied) {
      await releaseStock(order.items);
      order.inventoryApplied = false;
    }
    if (order.coupon?.coupon) await releaseCouponUsage(order.coupon.coupon, order.user);
    order.cancelledAt = new Date();
  }

  if (next === ORDER_STATUS.DELIVERED) {
    order.deliveredAt = new Date();
    await User.findByIdAndUpdate(order.user, {
      $inc: { 'stats.ordersCount': 1, 'stats.totalSpent': order.pricing.total },
    });
  }

  order.status = next;
  order.pushStatus(next, req.user._id, req.body.note);
  await order.save();

  return sendSuccess(res, { message: 'Order status updated.', data: { order } });
});

/** Manual payment reconciliation (cash collected, refund issued, etc.). */
export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found.');

  order.payment.status = req.body.paymentStatus;
  if (req.body.paymentStatus === PAYMENT_STATUS.PAID && !order.payment.paidAt) order.payment.paidAt = new Date();
  if (req.body.paymentStatus === PAYMENT_STATUS.REFUNDED) order.payment.refundedAt = new Date();

  order.pushStatus(order.status, req.user._id, `Payment marked as ${req.body.paymentStatus}. ${req.body.note || ''}`.trim());
  await order.save();

  return sendSuccess(res, { message: 'Payment status updated.', data: { order } });
});

/**
 * Permanently removes one order. There is no undo, so it is restricted to a
 * super admin and is deliberately per-order — there is no bulk wipe.
 *
 * Everything the order took is given back first: reserved stock, the customer's
 * coupon use, and the lifetime totals that delivering it had added.
 */
export const adminDeleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found.');

  if (order.inventoryApplied) {
    await releaseStock(order.items);
    order.inventoryApplied = false;
  }
  if (order.coupon?.coupon) await releaseCouponUsage(order.coupon.coupon, order.user);

  // Delivering an order incremented these, so deleting it has to undo them.
  if (order.status === ORDER_STATUS.DELIVERED) {
    await User.findByIdAndUpdate(order.user, {
      $inc: { 'stats.ordersCount': -1, 'stats.totalSpent': -order.pricing.total },
    });
  }

  await Order.deleteOne({ _id: order._id });

  return sendSuccess(res, { message: `Order ${order.orderNumber} deleted.`, data: { orderNumber: order.orderNumber } });
});

export const addOrderNote = asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { adminNotes: String(req.body.note || '').slice(0, 1000) },
    { new: true },
  );
  if (!order) throw ApiError.notFound('Order not found.');

  return sendSuccess(res, { message: 'Note saved.', data: { order } });
});

/** Orders belonging to one customer — used by the customer detail screen. */
export const getCustomerOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.params.id }).sort({ createdAt: -1 }).limit(50).lean({ virtuals: true });
  return sendSuccess(res, { data: { orders } });
});

import { Order } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { createPaymentSession, verifyHmac, fetchTransaction } from '../services/paymob.service.js';
import { releaseStock } from '../services/inventory.service.js';
import { releaseCouponUsage } from '../services/coupon.service.js';
import { env } from '../config/env.js';
import { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHODS } from '../config/constants.js';
import logger from '../utils/logger.js';

/** Starts a Paymob session and hands the client the hosted iframe URL. */
export const initiatePayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) throw ApiError.notFound('Order not found.');
  if (String(order.user) !== String(req.user._id)) throw ApiError.forbidden('You cannot pay for this order.');

  if (order.payment.status === PAYMENT_STATUS.PAID) throw ApiError.badRequest('This order has already been paid.');
  if (order.status === ORDER_STATUS.CANCELLED) throw ApiError.badRequest('This order has been cancelled.');
  if (order.payment.method === PAYMENT_METHODS.COD) throw ApiError.badRequest('This is a cash on delivery order.');

  const session = await createPaymentSession(order);

  order.payment.paymobOrderId = session.paymobOrderId;
  order.payment.provider = 'paymob';
  await order.save();

  return sendSuccess(res, {
    data: {
      iframeUrl: session.iframeUrl,
      paymobOrderId: session.paymobOrderId,
      orderNumber: order.orderNumber,
      amount: order.pricing.total,
      currency: order.pricing.currency,
    },
  });
});

/**
 * Applies a verified transaction result to an order. Idempotent: replayed
 * webhooks and a concurrent redirect callback cannot double-apply anything.
 */
const applyTransaction = async (transaction) => {
  const paymobOrderId = String(transaction?.order?.id ?? transaction?.order ?? '');
  if (!paymobOrderId) return null;

  const order = await Order.findOne({ 'payment.paymobOrderId': paymobOrderId });
  if (!order) {
    logger.warn(`Paymob callback for unknown order ${paymobOrderId}`);
    return null;
  }

  if (order.payment.status === PAYMENT_STATUS.PAID) return order;

  const succeeded = transaction.success === true && transaction.pending === false;

  order.payment.transactionId = String(transaction.id);
  order.payment.raw = transaction;

  if (succeeded) {
    order.payment.status = PAYMENT_STATUS.PAID;
    order.payment.paidAt = new Date();
    order.payment.failureReason = '';
    if (order.status === ORDER_STATUS.PENDING) {
      order.status = ORDER_STATUS.CONFIRMED;
      order.pushStatus(ORDER_STATUS.CONFIRMED, null, 'Payment received.');
    }
  } else if (transaction.pending !== true) {
    order.payment.status = PAYMENT_STATUS.FAILED;
    order.payment.failureReason =
      transaction?.data?.message || transaction?.data?.acq_response_code || 'The payment was declined.';

    // A failed payment must not hold stock hostage.
    if (order.inventoryApplied) {
      await releaseStock(order.items);
      order.inventoryApplied = false;
    }
    if (order.coupon?.coupon) {
      await releaseCouponUsage(order.coupon.coupon, order.user);
      order.coupon = { coupon: null, code: null, discountType: null, discountValue: 0 };
    }
    order.status = ORDER_STATUS.CANCELLED;
    order.cancelledAt = new Date();
    order.pushStatus(ORDER_STATUS.CANCELLED, null, 'Payment failed.');
  }

  await order.save();
  return order;
};

/**
 * Paymob server-to-server webhook. The HMAC signature is what makes the result
 * trustworthy — an unsigned or mismatched payload is discarded.
 */
export const paymobWebhook = asyncHandler(async (req, res) => {
  const receivedHmac = req.query.hmac || req.body?.hmac;
  const transaction = req.body?.obj;

  if (!transaction || !receivedHmac) {
    logger.warn('Paymob webhook rejected: missing transaction payload or HMAC.');
    return res.status(400).json({ success: false });
  }

  if (!verifyHmac(transaction, receivedHmac)) {
    logger.warn(`Paymob webhook rejected: HMAC mismatch for transaction ${transaction.id}.`);
    return res.status(401).json({ success: false });
  }

  await applyTransaction(transaction);

  // Always 200 on a verified payload so Paymob stops retrying.
  return res.status(200).json({ success: true });
});

/**
 * Browser redirect target. The querystring is HMAC-signed too, but we still
 * re-fetch the transaction from Paymob before trusting anything.
 */
export const paymobRedirect = asyncHandler(async (req, res) => {
  const { hmac, id: transactionId } = req.query;
  const clientUrl = env.clientUrl.replace(/\/$/, '');

  let order = null;
  let paid = false;

  try {
    if (transactionId) {
      const transaction = await fetchTransaction(transactionId);
      // Server-to-server lookup: the browser never decides the outcome.
      order = await applyTransaction(transaction);
      paid = order?.payment?.status === PAYMENT_STATUS.PAID;
    } else if (hmac && verifyHmac(req.query, hmac)) {
      paid = String(req.query.success) === 'true';
    }
  } catch (error) {
    logger.error(`Paymob redirect handling failed: ${error.message}`);
  }

  const target = paid
    ? `${clientUrl}/order-success?order=${order?.orderNumber || ''}`
    : `${clientUrl}/order-failed?order=${order?.orderNumber || ''}`;

  return res.redirect(302, target);
});

/** Polled by the payment screen while the customer completes the iframe flow. */
export const getPaymentStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId).select('orderNumber payment status pricing user');
  if (!order) throw ApiError.notFound('Order not found.');
  if (String(order.user) !== String(req.user._id)) throw ApiError.forbidden('You cannot view this order.');

  return sendSuccess(res, {
    data: {
      orderNumber: order.orderNumber,
      paymentStatus: order.payment.status,
      orderStatus: order.status,
      transactionId: order.payment.transactionId,
      total: order.pricing.total,
    },
  });
});

export const getPaymentConfig = asyncHandler(async (_req, res) =>
  sendSuccess(res, { data: { paymobEnabled: env.paymob.enabled } }),
);

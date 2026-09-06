import { Order } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { createPaymentSession, verifyHashKey, fetchInvoice } from '../services/fawaterak.service.js';
import { releaseStock } from '../services/inventory.service.js';
import { releaseCouponUsage } from '../services/coupon.service.js';
import { env } from '../config/env.js';
import { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHODS } from '../config/constants.js';
import logger from '../utils/logger.js';

/** Creates a Fawaterak invoice and hands the client the hosted payment URL. */
export const initiatePayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) throw ApiError.notFound('Order not found.');
  if (String(order.user) !== String(req.user._id)) throw ApiError.forbidden('You cannot pay for this order.');

  if (order.payment.status === PAYMENT_STATUS.PAID) throw ApiError.badRequest('This order has already been paid.');
  if (order.status === ORDER_STATUS.CANCELLED) throw ApiError.badRequest('This order has been cancelled.');
  if (order.payment.method === PAYMENT_METHODS.COD) throw ApiError.badRequest('This is a cash on delivery order.');

  const session = await createPaymentSession(order);

  order.payment.invoiceId = session.invoiceId;
  order.payment.invoiceKey = session.invoiceKey;
  order.payment.provider = 'fawaterak';
  await order.save();

  return sendSuccess(res, {
    data: {
      paymentUrl: session.paymentUrl,
      invoiceId: session.invoiceId,
      orderNumber: order.orderNumber,
      amount: order.pricing.total,
      currency: order.pricing.currency,
    },
  });
});

/**
 * Applies a verified invoice result to an order. Idempotent: a replayed webhook
 * and a concurrent redirect cannot double-apply anything.
 *
 * `invoice` must come from fetchInvoice — never from a request body.
 */
const applyInvoice = async (order, invoice, { failed = false, reason = '' } = {}) => {
  if (!order) return null;
  if (order.payment.status === PAYMENT_STATUS.PAID) return order;

  const paid = Number(invoice?.paid) === 1;

  if (paid) {
    // Guard against an invoice being settled for less than the order is worth.
    const expected = Number(order.pricing.total);
    const settled = Number(invoice.total);
    if (Number.isFinite(settled) && Math.abs(settled - expected) > 0.01) {
      logger.warn(
        `Fawaterak invoice ${invoice.invoice_id} settled ${settled} but order ${order.orderNumber} expects ${expected}.`,
      );
    }

    order.payment.status = PAYMENT_STATUS.PAID;
    order.payment.paidAt = invoice.paid_at ? new Date(invoice.paid_at) : new Date();
    order.payment.transactionId = String(invoice.invoice_id);
    order.payment.failureReason = '';
    order.payment.raw = invoice;

    if (order.status === ORDER_STATUS.PENDING) {
      order.status = ORDER_STATUS.CONFIRMED;
      order.pushStatus(ORDER_STATUS.CONFIRMED, null, 'Payment received.');
    }

    await order.save();
    return order;
  }

  // An unpaid invoice is only terminal when the provider says the attempt
  // failed. Anything else is still in flight and must stay pending, so the
  // customer can retry without losing the order.
  if (!failed) return order;

  order.payment.status = PAYMENT_STATUS.FAILED;
  order.payment.failureReason = reason || 'The payment was declined.';
  order.payment.raw = invoice || null;

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

  await order.save();
  return order;
};

/** Re-reads the invoice from Fawaterak, then applies it. */
const confirmAndApply = async (order, { failed = false, reason = '' } = {}) => {
  if (!order?.payment?.invoiceId) return null;
  const invoice = await fetchInvoice(order.payment.invoiceId);
  return applyInvoice(order, invoice, { failed, reason });
};

/**
 * Fawaterak server-to-server webhook. The hashKey proves the caller is
 * Fawaterak; the invoice lookup that follows proves the payment is real.
 */
export const fawaterakWebhook = asyncHandler(async (req, res) => {
  const payload = req.body || {};
  const { hashKey, invoice_id: invoiceId, invoice_status: invoiceStatus } = payload;

  if (!invoiceId || !hashKey) {
    logger.warn('Fawaterak webhook rejected: missing invoice id or hashKey.');
    return res.status(400).json({ success: false });
  }

  if (!verifyHashKey(payload, hashKey)) {
    logger.warn(`Fawaterak webhook rejected: hashKey mismatch for invoice ${invoiceId}.`);
    return res.status(401).json({ success: false });
  }

  const order = await Order.findOne({ 'payment.invoiceId': String(invoiceId) });
  if (!order) {
    logger.warn(`Fawaterak webhook for unknown invoice ${invoiceId}.`);
    // 200 so Fawaterak stops retrying a payload we will never match.
    return res.status(200).json({ success: true });
  }

  const failed = String(invoiceStatus).toLowerCase() === 'failed' || Boolean(payload.errorMessage);

  try {
    await confirmAndApply(order, { failed, reason: payload.errorMessage || '' });
  } catch (error) {
    // Signature was valid, so ask Fawaterak to retry rather than swallowing it.
    logger.error(`Fawaterak webhook verification failed for invoice ${invoiceId}: ${error.message}`);
    return res.status(502).json({ success: false });
  }

  return res.status(200).json({ success: true });
});

/**
 * Browser redirect target for successUrl / failUrl / pendingUrl. The
 * querystring is attacker-controllable, so it only selects which order to look
 * at — the outcome always comes from a fresh server-to-server lookup.
 */
export const fawaterakRedirect = asyncHandler(async (req, res) => {
  const { order: orderNumber, result } = req.query;
  const clientUrl = env.clientUrl.replace(/\/$/, '');

  let order = null;
  let paid = false;

  try {
    if (orderNumber) {
      order = await Order.findOne({ orderNumber: String(orderNumber) });
      const updated = await confirmAndApply(order, {
        failed: String(result) === 'failed',
        reason: 'The payment was not completed.',
      });
      paid = updated?.payment?.status === PAYMENT_STATUS.PAID;
    }
  } catch (error) {
    logger.error(`Fawaterak redirect handling failed: ${error.message}`);
  }

  const suffix = `?order=${order?.orderNumber || ''}`;
  const target = paid ? `${clientUrl}/order-success${suffix}` : `${clientUrl}/order-failed${suffix}`;

  return res.redirect(302, target);
});

/** Polled by the payment screen while the customer completes the hosted page. */
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
  sendSuccess(res, { data: { fawaterakEnabled: env.fawaterak.enabled } }),
);

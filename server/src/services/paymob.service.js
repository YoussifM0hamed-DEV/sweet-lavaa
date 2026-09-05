import axios from 'axios';
import crypto from 'crypto';
import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

/**
 * Paymob integration.
 *
 * Flow: auth token → register order → payment key → hosted iframe.
 * The result is NEVER taken from the browser: the order is only marked paid
 * after the webhook (or a server-to-server transaction lookup) is verified with
 * the HMAC secret.
 */

const http = axios.create({ baseURL: env.paymob.baseUrl, timeout: 20000 });

const assertConfigured = () => {
  if (!env.paymob.enabled) {
    throw ApiError.badRequest('Online payment is not configured. Please choose cash on delivery or contact support.');
  }
};

const toCents = (amount) => Math.round(Number(amount) * 100);

const request = async (method, url, data) => {
  try {
    const response = await http.request({ method, url, data });
    return response.data;
  } catch (error) {
    const detail = error.response?.data?.message || error.response?.data?.detail || error.message;
    logger.error(`Paymob ${method.toUpperCase()} ${url} failed: ${JSON.stringify(detail)}`);
    throw ApiError.internal('We could not reach the payment provider. Please try again in a moment.');
  }
};

/** Step 1 — obtain a short lived auth token. */
export const getAuthToken = async () => {
  assertConfigured();
  const data = await request('post', '/auth/tokens', { api_key: env.paymob.apiKey });
  if (!data?.token) throw ApiError.internal('Payment provider authentication failed.');
  return data.token;
};

/** Step 2 — register the order with Paymob. */
export const registerOrder = async ({ authToken, order }) => {
  const data = await request('post', '/ecommerce/orders', {
    auth_token: authToken,
    delivery_needed: true,
    amount_cents: toCents(order.pricing.total),
    currency: env.paymob.currency,
    merchant_order_id: `${order.orderNumber}-${Date.now()}`,
    items: order.items.map((item) => ({
      name: item.name.slice(0, 50),
      amount_cents: toCents(item.unitPrice),
      description: (item.categoryName || 'Sweet Lava').slice(0, 60),
      quantity: item.quantity,
    })),
    shipping_data: {
      first_name: order.contact.fullName.split(' ')[0] || 'Customer',
      last_name: order.contact.fullName.split(' ').slice(1).join(' ') || 'Customer',
      phone_number: order.contact.phone,
      email: order.contact.email,
      street: order.shippingAddress.street || 'NA',
      city: order.shippingAddress.city || order.deliveryZone.name,
      country: 'EG',
    },
  });

  if (!data?.id) throw ApiError.internal('The payment order could not be created.');
  return data;
};

const billingDataFrom = (order) => {
  const [first, ...rest] = order.contact.fullName.split(' ');
  return {
    first_name: first || 'Customer',
    last_name: rest.join(' ') || 'Customer',
    email: order.contact.email,
    phone_number: order.contact.phone,
    apartment: order.shippingAddress.apartment || 'NA',
    floor: order.shippingAddress.floor || 'NA',
    building: order.shippingAddress.building || 'NA',
    street: order.shippingAddress.street || 'NA',
    city: order.shippingAddress.city || order.deliveryZone.name || 'Cairo',
    state: order.shippingAddress.governorate || 'Cairo',
    country: 'EG',
    postal_code: 'NA',
    shipping_method: 'NA',
  };
};

/** Step 3 — request the payment key used by the hosted iframe. */
export const getPaymentKey = async ({ authToken, paymobOrderId, order }) => {
  const data = await request('post', '/acceptance/payment_keys', {
    auth_token: authToken,
    amount_cents: toCents(order.pricing.total),
    expiration: 3600,
    order_id: paymobOrderId,
    billing_data: billingDataFrom(order),
    currency: env.paymob.currency,
    integration_id: Number(env.paymob.integrationId),
    lock_order_when_paid: true,
  });

  if (!data?.token) throw ApiError.internal('The payment session could not be created.');
  return data.token;
};

export const buildIframeUrl = (paymentKey) =>
  `${env.paymob.baseUrl}/acceptance/iframes/${env.paymob.iframeId}?payment_token=${paymentKey}`;

/** Convenience wrapper running all three steps for an order document. */
export const createPaymentSession = async (order) => {
  assertConfigured();
  const authToken = await getAuthToken();
  const paymobOrder = await registerOrder({ authToken, order });
  const paymentKey = await getPaymentKey({ authToken, paymobOrderId: paymobOrder.id, order });

  return {
    paymobOrderId: String(paymobOrder.id),
    paymentKey,
    iframeUrl: buildIframeUrl(paymentKey),
  };
};

/**
 * Field order mandated by Paymob for HMAC calculation. Values are concatenated
 * in exactly this order and hashed with SHA-512 using the HMAC secret.
 */
const HMAC_FIELDS = [
  'amount_cents',
  'created_at',
  'currency',
  'error_occured',
  'has_parent_transaction',
  'id',
  'integration_id',
  'is_3d_secure',
  'is_auth',
  'is_capture',
  'is_refunded',
  'is_standalone_payment',
  'is_voided',
  'order.id',
  'owner',
  'pending',
  'source_data.pan',
  'source_data.sub_type',
  'source_data.type',
  'success',
];

const pick = (object, path) =>
  path.split('.').reduce((accumulator, key) => (accumulator == null ? undefined : accumulator[key]), object);

/** Recomputes the HMAC over a transaction payload and compares it in constant time. */
export const verifyHmac = (transaction, receivedHmac) => {
  if (!env.paymob.hmacSecret || !receivedHmac) return false;

  const concatenated = HMAC_FIELDS.map((field) => {
    const value = pick(transaction, field);
    if (value === true) return 'true';
    if (value === false) return 'false';
    return value === null || value === undefined ? '' : String(value);
  }).join('');

  const expected = crypto.createHmac('sha512', env.paymob.hmacSecret).update(concatenated).digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(receivedHmac), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

/** Server-to-server lookup used to confirm status independently of the webhook. */
export const fetchTransaction = async (transactionId) => {
  const authToken = await getAuthToken();
  return request('get', `/acceptance/transactions/${transactionId}?token=${authToken}`);
};

export default { createPaymentSession, verifyHmac, fetchTransaction, buildIframeUrl, getAuthToken };

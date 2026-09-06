import axios from 'axios';
import crypto from 'crypto';
import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

/**
 * Fawaterak integration.
 *
 * Flow: pick the account's card method → invoiceInitPay → the customer lands
 * directly on the card form → we are told the result twice (webhook + browser
 * redirect). Accounts with no card method enabled fall back to the hosted
 * invoice page, which lists whatever methods they do have.
 *
 * Neither result signal is trusted on its own. The webhook signature is
 * checked, but an order is only ever marked paid after `fetchInvoice` confirms
 * it directly with Fawaterak — the browser never decides the outcome.
 */

const http = axios.create({ timeout: 20000 });

const assertConfigured = () => {
  if (!env.fawaterak.enabled) {
    throw ApiError.badRequest('Online payment is not configured. Please choose cash on delivery or contact support.');
  }
};

/**
 * The v2 API authenticates with the dashboard's "HASH API key" as a plain
 * bearer token. The OAuth client_credentials grant on the same dashboard page
 * issues tokens that v2 rejects ("Invalid Token or inactive vendor"), so it is
 * deliberately not used here.
 */
const request = async (method, path, data) => {
  try {
    const response = await http.request({
      method,
      url: `${env.fawaterak.baseUrl}${path}`,
      data,
      headers: {
        Authorization: `Bearer ${env.fawaterak.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    const detail = error.response?.data?.message || error.response?.data?.error || error.message;
    logger.error(`Fawaterak ${method.toUpperCase()} ${path} failed: ${JSON.stringify(detail)}`);
    throw ApiError.internal('We could not reach the payment provider. Please try again in a moment.');
  }
};

const splitName = (fullName = '') => {
  const [first, ...rest] = String(fullName).trim().split(/\s+/);
  return { first: first || 'Customer', last: rest.join(' ') || 'Customer' };
};

/** Fawaterak rejects an invoice whose items do not add up to cartTotal. */
const buildCartItems = (order) => {
  const items = order.items.map((item) => ({
    name: String(item.name).slice(0, 100),
    price: Number(item.unitPrice).toFixed(2),
    quantity: String(item.quantity),
  }));

  // Delivery and discounts live outside the line items, so they are added as
  // their own rows to keep the total reconcilable on the Fawaterak side.
  const deliveryFee = Number(order.pricing.deliveryFee || 0);
  if (deliveryFee > 0) {
    items.push({ name: 'Delivery', price: deliveryFee.toFixed(2), quantity: '1' });
  }

  const discount = Number(order.pricing.discount || 0);
  if (discount > 0) {
    items.push({ name: 'Discount', price: (-discount).toFixed(2), quantity: '1' });
  }

  return items;
};

/** Fawaterak rejects anything at or below this, with a vague error. */
const MINIMUM_TOTAL = 5;

/** Methods change only when the merchant account does, so a short cache is plenty. */
let methodCache = { methods: null, expiresAt: 0 };

export const getPaymentMethods = async ({ force = false } = {}) => {
  assertConfigured();
  if (!force && methodCache.methods && Date.now() < methodCache.expiresAt) return methodCache.methods;

  const data = await request('get', '/api/v2/getPaymentmethods');
  const methods = Array.isArray(data?.data) ? data.data : [];
  methodCache = { methods, expiresAt: Date.now() + 10 * 60 * 1000 };
  return methods;
};

/**
 * The card option, so the customer lands on the card form instead of an
 * invoice page listing every method. Returns null when the merchant account
 * has no card method enabled yet.
 */
const findCardMethod = async () => {
  const methods = await getPaymentMethods();
  return (
    methods.find((method) => /visa|master|card/i.test(method?.name_en || '')) ||
    methods.find((method) => /فيزا|ماستر/i.test(method?.name_ar || '')) ||
    null
  );
};

const assertPayable = (order) => {
  if (Number(order.pricing.total) <= MINIMUM_TOTAL) {
    throw ApiError.badRequest(
      `Card payment needs an order above ${MINIMUM_TOTAL} ${env.fawaterak.currency}. Please choose cash on delivery.`,
    );
  }
};

export const createPaymentSession = async (order) => {
  assertConfigured();
  assertPayable(order);

  const card = await findCardMethod();
  if (card) return initCardPayment(order, card.paymentId);

  // No card method on the account — fall back to the hosted invoice, which at
  // least shows the customer whatever methods do become available.
  logger.warn('Fawaterak has no card method enabled; falling back to the hosted invoice page.');
  return createInvoiceSession(order);
};

/** Sends the customer straight to the card form for the chosen method. */
const initCardPayment = async (order, paymentMethodId) => {
  const data = await request('post', '/api/v2/invoiceInitPay', {
    payment_method_id: paymentMethodId,
    invoice_number: order.orderNumber,
    ...invoicePayload(order),
  });

  const redirectTo = data?.data?.payment_data?.redirectTo;
  if (data?.status !== 'success' || !redirectTo) {
    logger.error(`Fawaterak refused the payment: ${JSON.stringify(data).slice(0, 300)}`);
    throw ApiError.internal('The payment session could not be created.');
  }

  return {
    invoiceId: String(data.data.invoice_id),
    invoiceKey: String(data.data.invoice_key),
    paymentUrl: redirectTo,
  };
};

const createInvoiceSession = async (order) => {
  const data = await request('post', '/api/v2/createInvoiceLink', invoicePayload(order));

  if (data?.status !== 'success' || !data?.data?.url) {
    logger.error(`Fawaterak refused the invoice: ${JSON.stringify(data).slice(0, 300)}`);
    throw ApiError.internal('The payment session could not be created.');
  }

  return {
    invoiceId: String(data.data.invoiceId),
    invoiceKey: String(data.data.invoiceKey),
    paymentUrl: data.data.url,
  };
};

const invoicePayload = (order) => {
  const { first, last } = splitName(order.contact.fullName);
  const callback = `${env.serverUrl.replace(/\/$/, '')}/api/payments/fawaterak/callback`;
  const address = [order.shippingAddress.street, order.shippingAddress.city, order.shippingAddress.governorate]
    .filter(Boolean)
    .join(', ');

  return {
    cartTotal: Number(order.pricing.total).toFixed(2),
    currency: env.fawaterak.currency,
    customer: {
      first_name: first,
      last_name: last,
      email: order.contact.email,
      phone: order.contact.phone,
      address: address || 'NA',
    },
    redirectionUrls: {
      successUrl: `${callback}?order=${order.orderNumber}&result=success`,
      failUrl: `${callback}?order=${order.orderNumber}&result=failed`,
      pendingUrl: `${callback}?order=${order.orderNumber}&result=pending`,
    },
    cartItems: buildCartItems(order),
    // Echoed back verbatim in the webhook — useful when reconciling by hand.
    payLoad: { orderNumber: order.orderNumber },
  };
};

/**
 * Recomputes the webhook signature and compares it in constant time.
 * Fawaterak signs `InvoiceId=…&InvoiceKey=…&PaymentMethod=…` with the vendor
 * key using HMAC-SHA256.
 */
export const verifyHashKey = (payload, receivedHash) => {
  if (!env.fawaterak.vendorKey || !receivedHash) return false;

  const query =
    `InvoiceId=${payload?.invoice_id}` +
    `&InvoiceKey=${payload?.invoice_key}` +
    `&PaymentMethod=${payload?.payment_method}`;

  const expected = crypto.createHmac('sha256', env.fawaterak.vendorKey).update(query).digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(receivedHash), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

/** Server-to-server lookup. This — not the webhook body — decides "paid". */
export const fetchInvoice = async (invoiceId) => {
  assertConfigured();
  const data = await request('get', `/api/v2/getInvoiceData/${invoiceId}`);
  if (data?.status !== 'success' || !data?.data) {
    throw ApiError.internal('The payment could not be verified with the provider.');
  }
  return data.data;
};

export default { createPaymentSession, verifyHashKey, fetchInvoice, getPaymentMethods };

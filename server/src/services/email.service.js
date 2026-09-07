import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * Transactional email.
 *
 * Nothing here is allowed to break a request. A shop that refuses an order
 * because a mail server was slow is worse than one that sends no receipt, so
 * every send is fire-and-forget and failures are logged, never thrown.
 *
 * With no SMTP credentials the service stays silent and logs what it would
 * have sent, which keeps local development working without a mail account.
 */

let transporter = null;

const getTransporter = () => {
  if (!env.mail.enabled) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    // 465 is implicit TLS; 587 upgrades with STARTTLS.
    secure: env.mail.port === 465,
    auth: { user: env.mail.user, pass: env.mail.pass },
  });

  return transporter;
};

/** Proves the credentials work without sending anything. */
export const verifyConnection = async () => {
  const mailer = getTransporter();
  if (!mailer) throw new Error('SMTP is not configured.');
  await mailer.verify();
  return true;
};

const send = async ({ to, subject, html, text }) => {
  const mailer = getTransporter();

  if (!mailer) {
    logger.info(`[email skipped — SMTP not configured] to=${to} subject="${subject}"`);
    return false;
  }

  try {
    await mailer.sendMail({
      from: env.mail.from || `"${'Sweet Lava'}" <${env.mail.user}>`,
      to,
      subject,
      text,
      html,
    });
    logger.success(`Email sent → ${to} · ${subject}`);
    return true;
  } catch (error) {
    logger.error(`Email to ${to} failed: ${error.message}`);
    return false;
  }
};

/* ── Presentation ─────────────────────────────────────────────────────── */

const shell = (title, body) => `
<div style="margin:0;padding:24px;background:#faf6f1;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#33241a">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eee2d6">
    <div style="padding:20px 28px;border-bottom:1px solid #f2e8dd">
      <span style="font-size:19px;font-weight:700;letter-spacing:-.3px">Sweet <span style="color:#c98a45">Lava</span></span>
    </div>
    <div style="padding:28px">
      <h1 style="margin:0 0 14px;font-size:20px;font-weight:700">${title}</h1>
      ${body}
    </div>
    <div style="padding:16px 28px;border-top:1px solid #f2e8dd;font-size:12px;color:#9c8878">
      Sweet Lava · Handcrafted in Cairo
    </div>
  </div>
</div>`;

const button = (href, label) =>
  `<a href="${href}" style="display:inline-block;margin:18px 0;padding:12px 26px;background:#33241a;color:#fff;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px">${label}</a>`;

const money = (amount, currency = 'EGP') => `${Number(amount).toFixed(2)} ${currency}`;

/* ── Messages ─────────────────────────────────────────────────────────── */

export const sendPasswordReset = (user, resetUrl) =>
  send({
    to: user.email,
    subject: 'Reset your Sweet Lava password',
    text: `Reset your password: ${resetUrl} (expires in 30 minutes)`,
    html: shell(
      'Reset your password',
      `<p style="margin:0;font-size:14px;line-height:1.65;color:#6b5647">
         Hi ${user.firstName || 'there'} — use the button below to choose a new password.
         The link works for <strong>30 minutes</strong>.
       </p>
       ${button(resetUrl, 'Choose a new password')}
       <p style="margin:0;font-size:12px;line-height:1.6;color:#9c8878">
         If you did not ask for this, ignore this email — your password stays as it is.
       </p>`,
    ),
  });

const itemRows = (order) =>
  order.items
    .map(
      (item) => `<tr>
        <td style="padding:7px 0;font-size:13px;color:#33241a">${item.name} <span style="color:#9c8878">× ${item.quantity}</span></td>
        <td style="padding:7px 0;font-size:13px;text-align:right;color:#33241a">${money(item.lineTotal, order.pricing.currency)}</td>
      </tr>`,
    )
    .join('');

const totalsBlock = (order) => {
  const c = order.pricing.currency;
  const row = (label, value, strong) =>
    `<tr>
      <td style="padding:5px 0;font-size:${strong ? '15' : '13'}px;${strong ? 'font-weight:700' : 'color:#9c8878'}">${label}</td>
      <td style="padding:5px 0;font-size:${strong ? '15' : '13'}px;text-align:right;${strong ? 'font-weight:700' : 'color:#6b5647'}">${value}</td>
    </tr>`;

  return `${row('Subtotal', money(order.pricing.subtotal, c))}
    ${order.pricing.discount > 0 ? row('Discount', `− ${money(order.pricing.discount, c)}`) : ''}
    ${row(`Delivery (${order.deliveryZone.name})`, money(order.pricing.deliveryFee, c))}
    ${row('Total', money(order.pricing.total, c), true)}`;
};

/** Receipt for the customer, the moment the order is placed. */
export const sendOrderConfirmation = (order) =>
  send({
    to: order.contact.email,
    subject: `Order ${order.orderNumber} confirmed — Sweet Lava`,
    text: `Thank you! Order ${order.orderNumber} is confirmed. Total ${money(order.pricing.total, order.pricing.currency)}, payable in cash on delivery.`,
    html: shell(
      'Thank you for your order',
      `<p style="margin:0 0 18px;font-size:14px;line-height:1.65;color:#6b5647">
         Hi ${order.contact.fullName.split(' ')[0]}, we have your order and will start baking.
         Order number <strong>${order.orderNumber}</strong>.
       </p>
       <table style="width:100%;border-collapse:collapse;border-top:1px solid #f2e8dd;border-bottom:1px solid #f2e8dd">
         ${itemRows(order)}
       </table>
       <table style="width:100%;border-collapse:collapse;margin-top:12px">${totalsBlock(order)}</table>
       <p style="margin:20px 0 0;padding:12px 16px;background:#faf6f1;border-radius:10px;font-size:13px;line-height:1.6;color:#6b5647">
         <strong>Cash on delivery.</strong> Please have
         ${money(order.pricing.total, order.pricing.currency)} ready for the courier.
         Estimated delivery: ${order.deliveryZone.estimatedTime || 'we will call to confirm'}.
       </p>
       <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#6b5647">
         Delivering to: ${[order.shippingAddress.street, order.shippingAddress.city, order.shippingAddress.governorate].filter(Boolean).join(', ')}
       </p>`,
    ),
  });

/** Heads-up for the shop, so an order is not missed. */
export const sendNewOrderAlert = (order) => {
  if (!env.mail.notify) return Promise.resolve(false);

  return send({
    to: env.mail.notify,
    subject: `New order ${order.orderNumber} · ${money(order.pricing.total, order.pricing.currency)}`,
    text: `New order ${order.orderNumber} from ${order.contact.fullName} (${order.contact.phone}) — ${money(order.pricing.total, order.pricing.currency)}`,
    html: shell(
      `New order · ${money(order.pricing.total, order.pricing.currency)}`,
      `<table style="width:100%;border-collapse:collapse;margin-bottom:14px">
         <tr><td style="padding:4px 0;font-size:13px;color:#9c8878">Order</td><td style="padding:4px 0;font-size:13px;text-align:right"><strong>${order.orderNumber}</strong></td></tr>
         <tr><td style="padding:4px 0;font-size:13px;color:#9c8878">Customer</td><td style="padding:4px 0;font-size:13px;text-align:right">${order.contact.fullName}</td></tr>
         <tr><td style="padding:4px 0;font-size:13px;color:#9c8878">Phone</td><td style="padding:4px 0;font-size:13px;text-align:right">${order.contact.phone}</td></tr>
         <tr><td style="padding:4px 0;font-size:13px;color:#9c8878">Area</td><td style="padding:4px 0;font-size:13px;text-align:right">${order.deliveryZone.name}</td></tr>
       </table>
       <table style="width:100%;border-collapse:collapse;border-top:1px solid #f2e8dd;border-bottom:1px solid #f2e8dd">
         ${itemRows(order)}
       </table>
       ${button(`${env.clientUrl.replace(/\/$/, '')}/admin/orders`, 'Open the dashboard')}`,
    ),
  });
};

export default { sendPasswordReset, sendOrderConfirmation, sendNewOrderAlert, verifyConnection };

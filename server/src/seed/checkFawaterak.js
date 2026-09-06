/* eslint-disable no-console */
/**
 * Fawaterak pre-flight. Creates a real invoice, reads it back, then reports the
 * webhook URLs that still have to be registered by hand. A pass here means the
 * credentials and the invoice payload both work.
 */
import { env } from '../config/env.js';
import { createPaymentSession, fetchInvoice } from '../services/fawaterak.service.js';

/** A throwaway order-shaped object — nothing is written to the database. */
const SAMPLE_ORDER = {
  orderNumber: `PREFLIGHT-${Date.now()}`,
  contact: { fullName: 'Pre Flight', email: 'preflight@sweetlava.com', phone: '01000000000' },
  shippingAddress: { street: 'Test street', city: 'Cairo', governorate: 'Cairo' },
  // Fawaterak refuses anything at or below 5 EGP.
  pricing: { total: 10, deliveryFee: 0, discount: 0, currency: 'EGP' },
  items: [{ name: 'Pre-flight check', unitPrice: 10, quantity: 1 }],
};

const run = async () => {
  if (!env.fawaterak.enabled) {
    console.log('\n  Fawaterak is not configured. Add this to server/.env:\n');
    console.log('    FAWATERAK_API_KEY=');
    console.log('      Dashboard > Integrations > "HASH API key"\n');
    process.exit(1);
  }

  const live = !/staging/.test(env.fawaterak.baseUrl);
  console.log(`\n  Base URL: ${env.fawaterak.baseUrl}`);
  console.log(`  Currency: ${env.fawaterak.currency}`);
  console.log(`  Mode:     ${live ? 'LIVE — invoices here are real' : 'STAGING'}`);
  console.log(`\n  Creating a 10 ${env.fawaterak.currency} test invoice...`);

  let session;
  try {
    session = await createPaymentSession(SAMPLE_ORDER);
    console.log(`  Invoice created OK -> id ${session.invoiceId}`);
    console.log(`  Payment page       -> ${session.paymentUrl}`);
  } catch (error) {
    console.error(`\n  Invoice creation FAILED: ${error.message}\n`);
    console.error('  Most likely: FAWATERAK_API_KEY is wrong, or it belongs to the other environment');
    console.error(`  (staging keys do not work on app.fawaterk.com and vice versa).\n`);
    process.exit(1);
  }

  try {
    console.log('  Reading the invoice back...');
    const invoice = await fetchInvoice(session.invoiceId);
    console.log(`  Lookup OK          -> total ${invoice.total} ${invoice.currency}, paid=${invoice.paid}`);
  } catch (error) {
    console.error(`\n  Invoice lookup FAILED: ${error.message}`);
    console.error('  Payments could be taken but never confirmed. Fix this before going live.\n');
    process.exit(1);
  }

  const hook = `${env.serverUrl.replace(/\/$/, '')}/api/payments/fawaterak/webhook`;
  console.log('\n  Remaining manual step: Fawaterak must be able to reach your server.');
  console.log('  Set BOTH of these under Integrations > Webhooks/redirections URLs:');
  console.log(`    Paid transactions webhook   : ${hook}`);
  console.log(`    Failed transactions webhook : ${hook}`);
  console.log('\n  Leave the Success/Fail/Pending Redirect Url fields EMPTY — those are sent');
  console.log('  per invoice and carry the order number, which the dashboard ones cannot.');

  if (/localhost|127\.0\.0\.1/.test(env.serverUrl)) {
    console.log('\n  NOTE: SERVER_URL is still localhost, which Fawaterak cannot reach.');
    console.log('  Payments will complete but the webhook will never arrive. Use a tunnel');
    console.log('  (e.g. ngrok) or the deployed URL to test the full round trip.');
  }

  console.log('\n  Fawaterak is working.\n');
  process.exit(0);
};

run();

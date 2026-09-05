/* eslint-disable no-console */
/**
 * Paymob pre-flight. Confirms the credentials are present and that the API key
 * is actually accepted, so failures show up here rather than at checkout.
 */
import axios from 'axios';
import { env } from '../config/env.js';

const REQUIRED = [
  ['PAYMOB_API_KEY', env.paymob.apiKey, 'Dashboard > Settings > Account Info > API Key (a very long token)'],
  ['PAYMOB_INTEGRATION_ID', env.paymob.integrationId, 'Developers > Payment Integrations > the ID column of your card integration'],
  ['PAYMOB_IFRAME_ID', env.paymob.iframeId, 'Developers > iframes > the ID of the iframe you created'],
  ['PAYMOB_HMAC_SECRET', env.paymob.hmacSecret, 'Settings > Account Info > HMAC Secret'],
];

const run = async () => {
  console.log('');
  const missing = REQUIRED.filter(([, value]) => !value);

  REQUIRED.forEach(([name, value]) => {
    const shown = value ? `${String(value).slice(0, 6)}...(${String(value).length} chars)` : 'MISSING';
    console.log(`  ${value ? 'OK  ' : '--  '} ${name.padEnd(24)} ${shown}`);
  });

  if (missing.length) {
    console.log('\n  Add these to server/.env:\n');
    missing.forEach(([name, , where]) => console.log(`    ${name}\n      -> ${where}\n`));
    process.exit(1);
  }

  console.log(`\n  Base URL: ${env.paymob.baseUrl}`);
  console.log('  Authenticating with Paymob...');

  try {
    const { data } = await axios.post(
      `${env.paymob.baseUrl}/auth/tokens`,
      { api_key: env.paymob.apiKey },
      { timeout: 20000 },
    );

    if (!data?.token) throw new Error('Paymob returned no token.');

    console.log('  API key accepted.');
    console.log(`  Merchant: ${data.profile?.user?.username || data.profile?.id || 'n/a'}`);
    console.log('\n  Credentials look good.\n');
    console.log('  Remaining manual step: Paymob must be able to reach your server.');
    console.log('  Set these in the Paymob dashboard (Developers > Payment Integrations > edit):');
    console.log(`    Transaction processed callback : ${env.serverUrl}/api/payments/paymob/webhook`);
    console.log(`    Transaction response callback  : ${env.serverUrl}/api/payments/paymob/callback\n`);

    if (env.serverUrl.includes('localhost')) {
      console.log('  NOTE: SERVER_URL is still localhost, which Paymob cannot reach.');
      console.log('  Expose it with a tunnel (e.g. cloudflared or ngrok) and set SERVER_URL to that public URL.\n');
    }
    process.exit(0);
  } catch (error) {
    const detail = error.response?.data;
    console.error(`\n  Authentication FAILED: ${error.message}`);
    if (detail) console.error(`  Paymob said: ${JSON.stringify(detail).slice(0, 200)}`);
    console.error('\n  Most likely: PAYMOB_API_KEY is wrong, truncated, or from a different account.');
    console.error('  It is a very long JWT-looking string, not the "Public Key" or "Secret Key".\n');
    process.exit(1);
  }
};

run();

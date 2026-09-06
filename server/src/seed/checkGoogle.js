/* eslint-disable no-console */
/**
 * Google sign-in pre-flight.
 *
 * The failure this catches most often is not a bad key — it is the client id
 * drifting out of sync between server/.env and client/.env, or the origin never
 * being registered. Google cannot be asked which origins are registered, so the
 * origin list is printed for you to compare against the console.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_ENV = path.resolve(__dirname, '../../../client/.env');

const readClientId = () => {
  try {
    const contents = fs.readFileSync(CLIENT_ENV, 'utf8');
    const match = contents.match(/^VITE_GOOGLE_CLIENT_ID=(.*)$/m);
    return match ? match[1].trim() : '';
  } catch {
    return null; // file missing
  }
};

const fail = (message, hint) => {
  console.error(`\n  ${message}\n`);
  if (hint) console.error(`${hint}\n`);
  process.exit(1);
};

const run = async () => {
  console.log('\n  Checking Google sign-in configuration...\n');

  if (!env.google.enabled) {
    fail(
      'GOOGLE_CLIENT_ID is not set — Google sign-in is disabled.',
      '  Add it to server/.env. Create the credential at\n' +
        '  console.cloud.google.com > APIs & Services > Credentials > OAuth client ID (Web application).',
    );
  }

  if (!/\.apps\.googleusercontent\.com$/.test(env.google.clientId)) {
    fail(
      'GOOGLE_CLIENT_ID does not look like a client id.',
      '  It must end with ".apps.googleusercontent.com".\n  You may have pasted the client secret or the project number.',
    );
  }
  console.log(`  Server client id  OK  ${env.google.clientId.slice(0, 28)}…`);

  if (!env.google.clientSecret) {
    console.log('  GOOGLE_CLIENT_SECRET is empty — fine for ID-token sign-in, required for anything server-side.');
  }

  const clientId = readClientId();
  if (clientId === null) {
    console.log('  client/.env not found — skipping the front-end comparison.');
  } else if (!clientId) {
    fail(
      'VITE_GOOGLE_CLIENT_ID is empty in client/.env.',
      '  The button renders nothing without it. Copy the same id used on the server.',
    );
  } else if (clientId !== env.google.clientId) {
    fail(
      'The client ids do NOT match.',
      `  server/.env : ${env.google.clientId}\n` +
        `  client/.env : ${clientId}\n\n` +
        '  The browser would sign in against one project while the server verifies\n' +
        '  against another, so every sign-in is rejected. Make them identical.',
    );
  } else {
    console.log('  Client id match   OK  server/.env and client/.env agree');
  }

  // Only JavaScript origins matter here: the front end uses the ID-token flow,
  // where Google never redirects anywhere, so redirect URIs are irrelevant.
  const origins = new Set(['http://localhost:5173', 'http://localhost:5174']);
  if (env.clientUrl) origins.add(env.clientUrl.replace(/\/$/, ''));

  console.log('\n  Remaining manual step — Google cannot be asked which origins are registered.');
  console.log('  In console.cloud.google.com > Credentials > your OAuth client >');
  console.log('  "Authorized JavaScript origins", these must all be present:\n');
  [...origins].forEach((origin) => console.log(`    ${origin}`));
  console.log('\n  Exact match only: scheme, host and port, with no trailing slash and no path.');
  console.log('  Leave "Authorized redirect URIs" empty — this flow never uses them.');
  console.log('\n  If sign-in still fails, the browser console will say');
  console.log('  "The given origin is not allowed for the given client ID" — that is this list.\n');

  process.exit(0);
};

run();

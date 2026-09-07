/* eslint-disable no-console */
/**
 * Email pre-flight. Verifies the SMTP credentials, then sends one real message
 * to yourself — a pass here means order confirmations will genuinely arrive.
 */
import { env } from '../config/env.js';
import { verifyConnection, sendPasswordReset } from '../services/email.service.js';

const HINTS = [
  {
    match: (m) => /invalid login|username and password not accepted|535/i.test(m),
    hint:
      'Gmail rejected the credentials. Two things trip people up:\n' +
      '    · SMTP_PASS must be a 16-character App Password, not your Gmail password.\n' +
      '    · App Passwords only exist once 2-Step Verification is on.\n' +
      '    Create one at https://myaccount.google.com/apppasswords',
  },
  {
    match: (m) => /ETIMEDOUT|ECONNREFUSED|ENOTFOUND|ESOCKET/i.test(m),
    hint:
      'Could not reach the mail server. Check SMTP_HOST and SMTP_PORT.\n' +
      '    Gmail: smtp.gmail.com on port 465. Some networks block outbound SMTP.',
  },
];

const run = async () => {
  if (!env.mail.enabled) {
    console.log('\n  Email is not configured. Add these to server/.env:\n');
    console.log('    SMTP_USER=your.address@gmail.com');
    console.log('    SMTP_PASS=<16-character App Password>');
    console.log('\n  Create the App Password at https://myaccount.google.com/apppasswords');
    console.log('  (2-Step Verification has to be on for that page to exist.)\n');
    process.exit(1);
  }

  console.log(`\n  Host   : ${env.mail.host}:${env.mail.port}`);
  console.log(`  User   : ${env.mail.user}`);
  console.log(`  Alerts : ${env.mail.notify}`);

  try {
    console.log('\n  Checking the credentials...');
    await verifyConnection();
    console.log('  Login OK');
  } catch (error) {
    console.error(`\n  Login FAILED: ${error.message}\n`);
    const hint = HINTS.find((h) => h.match(error.message));
    console.error(hint ? `  ${hint.hint}\n` : '  Check SMTP_USER and SMTP_PASS in server/.env\n');
    process.exit(1);
  }

  console.log('  Sending a test email to yourself...');
  const sent = await sendPasswordReset(
    { email: env.mail.notify, firstName: 'there' },
    `${env.clientUrl.replace(/\/$/, '')}/reset-password/preflight-test-token`,
  );

  if (!sent) {
    console.error('\n  The send failed — see the error logged above.\n');
    process.exit(1);
  }

  console.log(`\n  Sent. Check ${env.mail.notify} (look in spam the first time).`);
  console.log('  Once it arrives, customers will get their order confirmations too.\n');
};

run();

import LegalPage from './LegalPage.jsx';

const SECTIONS = [
  {
    heading: 'What this policy covers',
    body: [
      'This policy explains what personal information we collect when you use this website, why we collect it, and what choices you have about it.',
      'We collect only what we need to take an order, deliver it, and support you afterwards. We do not sell your data.',
    ],
  },
  {
    heading: 'Information you give us',
    body: ['When you create an account or place an order, you provide:'],
    list: [
      'Your name, email address and phone number.',
      'Delivery addresses you choose to save.',
      'Order contents, delivery notes and any message you ask us to write on a card.',
      'Reviews and contact form messages you submit.',
      'A password, which is stored only as a salted bcrypt hash and can never be read back by us or by anyone else.',
    ],
  },
  {
    heading: 'Information we collect automatically',
    body: [
      'We record basic technical information such as your IP address and browser type in our server logs, which helps us detect abuse and diagnose faults.',
      'We store a small amount of information in your browser: your session token, your cart if you are not signed in, and your recent searches. This stays on your device.',
    ],
  },
  {
    heading: 'Payment information',
    body: [
      'We do not take card payments, so no card details are ever entered on this site or stored by us. Orders are paid in cash on delivery.',
      'We store only the transaction reference, the amount, the payment method type and the status, which is what we need to reconcile and support your order.',
    ],
  },
  {
    heading: 'How we use your information',
    body: ['We use your information to:'],
    list: [
      'Process, prepare and deliver your orders.',
      'Contact you about an order, including calls from our courier.',
      'Provide customer support and handle complaints.',
      'Detect and prevent fraud and abuse of coupons.',
      'Improve the products and the website, using aggregated figures rather than individual profiles.',
      'Send marketing emails, but only if you subscribed to them.',
    ],
  },
  {
    heading: 'Who we share it with',
    body: [
      'We share the minimum necessary with the services that make an order possible: our image hosting provider (Cloudinary), our delivery couriers, and our hosting provider.',
      'We may disclose information where the law requires it, or to protect our rights and the safety of our customers and staff. We do not sell or rent your personal data to anyone.',
    ],
  },
  {
    heading: 'Google sign-in',
    body: [
      'If you choose to sign in with Google, we receive your name, email address and profile picture from Google after verifying the sign-in token. We do not receive your Google password and we cannot access anything else in your Google account.',
    ],
  },
  {
    heading: 'How long we keep it',
    body: [
      'Account information is kept while your account is open. Order records are kept for as long as accounting and tax rules require, even if you close your account.',
      'If you deactivate your account, we disable access and stop marketing to you, but we retain the order history attached to it for those legal reasons.',
    ],
  },
  {
    heading: 'Your choices',
    body: ['You can, at any time:'],
    list: [
      'View and correct your profile details and saved addresses from your account page.',
      'Unsubscribe from marketing emails using the link in any of them.',
      'Delete a review you have written.',
      'Deactivate your account from your account settings.',
      'Ask us for a copy of the personal data we hold about you, or ask us to delete it where we are not required to keep it.',
    ],
  },
  {
    heading: 'Security',
    body: [
      'We protect your data with encrypted connections, hashed passwords, signed session tokens, role-based access controls that restrict what staff can see, rate limiting on sensitive endpoints, and server-side validation of every request.',
      'No system is perfectly secure. If a breach ever affects your personal data, we will tell you and the relevant authorities promptly.',
    ],
  },
  {
    heading: "Children's privacy",
    body: [
      'This site is not directed at children under 16, and we do not knowingly collect their personal information. If you believe a child has given us data, contact us and we will delete it.',
    ],
  },
  {
    heading: 'Changes to this policy',
    body: [
      'If we make a material change to how we handle your data, we will update the date at the top of this page and, where appropriate, tell you directly.',
    ],
  },
];

const Privacy = () => (
  <LegalPage
    title="Privacy policy"
    description="What we collect, why we collect it, and the control you have over it."
    updated="1 September 2026"
    sections={SECTIONS}
  />
);

export default Privacy;

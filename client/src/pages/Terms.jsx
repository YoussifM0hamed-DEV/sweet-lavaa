import LegalPage from './LegalPage.jsx';

const SECTIONS = [
  {
    heading: 'Agreement to these terms',
    body: [
      'By browsing this website, creating an account or placing an order, you agree to these terms. If you do not agree with them, please do not use the site.',
      'We may update these terms as the business changes. The date at the top of this page always reflects the current version.',
    ],
  },
  {
    heading: 'Your account',
    body: [
      'You are responsible for keeping your password confidential and for everything that happens under your account. Tell us immediately if you believe someone else has access to it.',
      'You must give accurate contact details. We use them to confirm orders and arrange delivery, and incorrect details are the most common reason a delivery fails.',
    ],
  },
  {
    heading: 'Products, pricing and availability',
    body: [
      'We bake in small batches, so availability changes through the day. An item in your cart is not reserved until your order is placed.',
      'All prices are in Egyptian Pounds and include applicable taxes unless stated otherwise. Prices, discounts and delivery fees shown at checkout are calculated by our server, and that calculation is what applies to your order.',
      'Product photography is representative. Handmade items vary slightly in appearance from one batch to the next.',
    ],
  },
  {
    heading: 'Orders and acceptance',
    body: [
      'Your order is an offer to buy. We accept it when we confirm the order, at which point a contract is formed between us.',
      'We may decline or cancel an order if an item is unavailable, if there is a pricing error, if we cannot deliver to the address given, or if we suspect fraudulent use of a payment method. If we cancel a paid order, we refund it in full.',
    ],
  },
  {
    heading: 'Payment',
    body: [
      'Orders are paid in cash to the courier on delivery. We do not take card payments at the moment.',
      'An order is treated as paid only once our server has verified the payment result with the provider. Where cash on delivery is available, payment is due to the courier on arrival.',
    ],
  },
  {
    heading: 'Delivery',
    body: [
      'We deliver to the areas listed at checkout. The fee and estimated time for each area are shown before you pay and are set from our current delivery configuration.',
      'Estimates are not guarantees. Traffic, weather and demand can affect timing, and we will contact you if there is a significant delay.',
      'Somebody must be available to receive the order at the address given. If nobody is reachable after the courier calls, the order may be returned and a redelivery fee may apply.',
    ],
  },
  {
    heading: 'Cancellations, returns and refunds',
    body: [
      'Because everything is freshly baked and perishable, we cannot accept returns once an order has been delivered.',
      'You can cancel an order yourself from your account while it is still Pending or Confirmed. After that, contact us and we will help where we can.',
    ],
    list: [
      'If an item arrives damaged, contact us within 24 hours with photos and we will replace it or refund it.',
      'If an item is missing from your order, we will refund that item or send it with your next delivery.',
      'Approved refunds are returned to the original payment method, usually within 5 to 14 business days depending on your bank.',
    ],
  },
  {
    heading: 'Coupons and promotions',
    body: [
      'Coupon codes are subject to the conditions attached to each code, including minimum order value, expiry date, usage limits and per-customer limits. All of these are enforced by our server when the code is applied.',
      'Coupons have no cash value, cannot be exchanged, and may be withdrawn at any time. We may cancel orders where a coupon has been used in a way it was not intended.',
    ],
  },
  {
    heading: 'Allergens and food safety',
    body: [
      'Allergen information is listed on every product page. Our kitchen handles gluten, dairy, eggs, nuts, soy and sesame, and we cannot guarantee that any product is free from traces of them.',
      'If you have a severe allergy, contact us before ordering so we can tell you honestly whether we can accommodate it.',
      'Keep products refrigerated and consume them within the period stated on the product page.',
    ],
  },
  {
    heading: 'Reviews and user content',
    body: [
      'Only customers who have received an order may review the product they bought. By posting a review you grant us permission to display it on the site.',
      'We may remove content that is abusive, misleading, unlawful or unrelated to the product. We do not remove reviews simply for being critical.',
    ],
  },
  {
    heading: 'Intellectual property',
    body: [
      'The content on this site, including recipes, photography, text and branding, belongs to us or our licensors and may not be reproduced commercially without written permission.',
    ],
  },
  {
    heading: 'Liability',
    body: [
      'Nothing in these terms limits our liability for death or personal injury caused by negligence, for fraud, or for anything else that cannot be limited under Egyptian law.',
      'Subject to that, our total liability in relation to any order is limited to the amount you paid for that order.',
    ],
  },
  {
    heading: 'Governing law',
    body: [
      'These terms are governed by the laws of the Arab Republic of Egypt, and the courts of Cairo have exclusive jurisdiction over any dispute arising from them.',
    ],
  },
];

const Terms = () => (
  <LegalPage
    title="Terms & conditions"
    description="The terms that apply when you browse this site and place an order with us."
    updated="1 September 2026"
    sections={SECTIONS}
  />
);

export default Terms;

export const ORDER_STATUS_META = {
  pending: { label: 'Pending', tone: 'warning', description: 'We have received your order.' },
  confirmed: { label: 'Confirmed', tone: 'info', description: 'Your order is confirmed and queued.' },
  preparing: { label: 'Preparing', tone: 'info', description: 'Our bakers are on it.' },
  out_for_delivery: { label: 'Out for delivery', tone: 'info', description: 'On the way to you.' },
  delivered: { label: 'Delivered', tone: 'success', description: 'Enjoy every bite.' },
  cancelled: { label: 'Cancelled', tone: 'danger', description: 'This order was cancelled.' },
};

export const ORDER_STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

export const PAYMENT_STATUS_META = {
  pending: { label: 'Pending', tone: 'warning' },
  paid: { label: 'Paid', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  refunded: { label: 'Refunded', tone: 'neutral' },
};

/**
 * Only cash on delivery is offered. The other two are kept so orders taken
 * before online payment was removed still show a label instead of a blank.
 */
export const PAYMENT_METHOD_META = {
  cash_on_delivery: { label: 'Cash on delivery', description: 'Pay the courier when it arrives' },
  card: { label: 'Card (no longer offered)', description: 'Paid online before card payment was retired' },
  wallet: { label: 'Wallet (no longer offered)', description: 'Paid online before card payment was retired' },
};

export const ROLE_META = {
  customer: { label: 'Customer', tone: 'neutral' },
  support: { label: 'Support', tone: 'info' },
  manager: { label: 'Manager', tone: 'warning' },
  admin: { label: 'Admin', tone: 'success' },
  super_admin: { label: 'Super admin', tone: 'danger' },
};

export const SORT_OPTIONS = [
  { value: 'popular', label: 'Most popular' },
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'name', label: 'Name A–Z' },
];

export const ALLERGEN_OPTIONS = ['Gluten', 'Eggs', 'Dairy', 'Nuts', 'Soy', 'Sesame', 'Peanuts'];

export const ROLES = {
  CUSTOMER: 'customer',
  SUPPORT: 'support',
  MANAGER: 'manager',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

export const ROLE_HIERARCHY = {
  [ROLES.CUSTOMER]: 0,
  [ROLES.SUPPORT]: 10,
  [ROLES.MANAGER]: 20,
  [ROLES.ADMIN]: 30,
  [ROLES.SUPER_ADMIN]: 40,
};

export const STAFF_ROLES = [ROLES.SUPPORT, ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN];

/**
 * Granular permissions. Roles map onto permission sets so new roles can be added
 * later without touching individual routes.
 */
export const PERMISSIONS = {
  PRODUCT_VIEW: 'product:view',
  PRODUCT_MANAGE: 'product:manage',
  CATEGORY_MANAGE: 'category:manage',
  ORDER_VIEW: 'order:view',
  ORDER_MANAGE: 'order:manage',
  CUSTOMER_VIEW: 'customer:view',
  CUSTOMER_MANAGE: 'customer:manage',
  USER_MANAGE: 'user:manage',
  COUPON_MANAGE: 'coupon:manage',
  DELIVERY_MANAGE: 'delivery:manage',
  INVENTORY_MANAGE: 'inventory:manage',
  REVIEW_MODERATE: 'review:moderate',
  SETTINGS_MANAGE: 'settings:manage',
  ANALYTICS_VIEW: 'analytics:view',
};

const P = PERMISSIONS;

export const ROLE_PERMISSIONS = {
  [ROLES.CUSTOMER]: [],
  [ROLES.SUPPORT]: [P.PRODUCT_VIEW, P.ORDER_VIEW, P.CUSTOMER_VIEW],
  [ROLES.MANAGER]: [
    P.PRODUCT_VIEW,
    P.PRODUCT_MANAGE,
    P.CATEGORY_MANAGE,
    P.ORDER_VIEW,
    P.ORDER_MANAGE,
    P.CUSTOMER_VIEW,
    P.COUPON_MANAGE,
    P.INVENTORY_MANAGE,
    P.REVIEW_MODERATE,
    P.ANALYTICS_VIEW,
  ],
  [ROLES.ADMIN]: Object.values(P),
  [ROLES.SUPER_ADMIN]: Object.values(P),
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const ORDER_STATUS_FLOW = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERED,
];

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const PAYMENT_METHODS = {
  CARD: 'card',
  WALLET: 'wallet',
  COD: 'cash_on_delivery',
};

export const COUPON_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
};

export default { ROLES, PERMISSIONS, ROLE_PERMISSIONS, ORDER_STATUS, PAYMENT_STATUS, COUPON_TYPES };

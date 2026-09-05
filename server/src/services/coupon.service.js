import { Coupon } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { round2 } from '../utils/money.js';
import { COUPON_TYPES } from '../config/constants.js';

/**
 * Validates a coupon against the current cart and user, and returns the coupon
 * plus the discount amount. All validation happens here — never on the client.
 *
 * @param {object}  params
 * @param {string}  params.code        Raw coupon code from the customer.
 * @param {string}  params.userId      The customer applying it.
 * @param {number}  params.subtotal    Server-calculated cart subtotal.
 * @param {Array}   params.lines       Priced cart lines (for category/product scoping).
 * @param {boolean} params.throwOnFail When false, returns null instead of throwing.
 */
export const validateCoupon = async ({ code, userId, subtotal, lines = [], throwOnFail = true }) => {
  const fail = (message) => {
    if (throwOnFail) throw ApiError.badRequest(message);
    return null;
  };

  if (!code) return null;

  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase() });
  if (!coupon) return fail('This coupon code is not valid.');
  if (!coupon.isActive) return fail('This coupon is no longer active.');

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) return fail('This coupon is not active yet.');
  if (coupon.expiresAt < now) return fail('This coupon has expired.');
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    return fail('This coupon has reached its usage limit.');
  }

  if (userId && coupon.perUserLimit > 0 && coupon.usageForUser(userId) >= coupon.perUserLimit) {
    return fail('You have already used this coupon.');
  }

  // Scoped coupons only discount the qualifying portion of the cart.
  const scoped = coupon.applicableCategories.length > 0 || coupon.applicableProducts.length > 0;
  let eligibleAmount = subtotal;

  if (scoped) {
    const categoryIds = coupon.applicableCategories.map(String);
    const productIds = coupon.applicableProducts.map(String);
    eligibleAmount = round2(
      lines
        .filter(
          (line) => productIds.includes(String(line.product)) || categoryIds.includes(String(line.category || '')),
        )
        .reduce((total, line) => total + line.lineTotal, 0),
    );
    if (eligibleAmount <= 0) return fail('This coupon does not apply to the items in your cart.');
  }

  if (coupon.minOrderAmount > 0 && subtotal < coupon.minOrderAmount) {
    return fail(`Add ${round2(coupon.minOrderAmount - subtotal)} EGP more to use this coupon.`);
  }

  let discount =
    coupon.discountType === COUPON_TYPES.PERCENTAGE
      ? round2((eligibleAmount * coupon.discountValue) / 100)
      : round2(Math.min(coupon.discountValue, eligibleAmount));

  if (coupon.discountType === COUPON_TYPES.PERCENTAGE && coupon.maxDiscountAmount > 0) {
    discount = round2(Math.min(discount, coupon.maxDiscountAmount));
  }

  // The discount can never exceed the cart value.
  discount = round2(Math.min(discount, subtotal));

  if (discount <= 0) return fail('This coupon does not reduce your current total.');

  return { coupon, discount };
};

/** Records a redemption. Called only after an order is successfully created. */
export const recordCouponUsage = async (couponId, userId) => {
  if (!couponId) return;
  const coupon = await Coupon.findById(couponId);
  if (!coupon) return;

  const entry = coupon.usedBy.find((item) => String(item.user) === String(userId));
  if (entry) {
    entry.count += 1;
    entry.lastUsedAt = new Date();
  } else {
    coupon.usedBy.push({ user: userId, count: 1, lastUsedAt: new Date() });
  }
  coupon.usedCount += 1;
  await coupon.save();
};

/** Reverses a redemption when an order is cancelled before fulfilment. */
export const releaseCouponUsage = async (couponId, userId) => {
  if (!couponId) return;
  const coupon = await Coupon.findById(couponId);
  if (!coupon) return;

  const entry = coupon.usedBy.find((item) => String(item.user) === String(userId));
  if (entry && entry.count > 0) entry.count -= 1;
  if (coupon.usedCount > 0) coupon.usedCount -= 1;
  await coupon.save();
};

export default { validateCoupon, recordCouponUsage, releaseCouponUsage };

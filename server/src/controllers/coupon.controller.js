import { Coupon, Cart } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess, buildPaginationMeta } from '../utils/apiResponse.js';
import { validateCoupon } from '../services/coupon.service.js';
import { quoteCart } from '../services/pricing.service.js';

/** Customer-facing check used by the checkout coupon field. */
export const checkCoupon = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart?.items.length) throw ApiError.badRequest('Add something to your cart before applying a coupon.');

  const quote = await quoteCart({ items: cart.items, userId: req.user._id, strict: false });

  const result = await validateCoupon({
    code: req.body.code,
    userId: req.user._id,
    subtotal: quote.pricing.subtotal,
    lines: quote.lines,
    throwOnFail: true,
  });

  return sendSuccess(res, {
    message: `Coupon ${result.coupon.code} is valid.`,
    data: {
      code: result.coupon.code,
      discountType: result.coupon.discountType,
      discountValue: result.coupon.discountValue,
      discount: result.discount,
    },
  });
});

export const adminListCoupons = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);

  const filter = {};
  if (req.query.search) filter.code = { $regex: String(req.query.search).toUpperCase(), $options: 'i' };
  if (req.query.status === 'active') filter.isActive = true;
  if (req.query.status === 'inactive') filter.isActive = false;
  if (req.query.status === 'expired') filter.expiresAt = { $lt: new Date() };

  const [coupons, total] = await Promise.all([
    Coupon.find(filter)
      .populate('applicableCategories', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean({ virtuals: true }),
    Coupon.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: { coupons }, meta: buildPaginationMeta({ page, limit, total }) });
});

export const adminGetCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id).lean({ virtuals: true });
  if (!coupon) throw ApiError.notFound('Coupon not found.');
  return sendSuccess(res, { data: { coupon } });
});

export const createCoupon = asyncHandler(async (req, res) => {
  if (new Date(req.body.expiresAt) <= new Date()) {
    throw ApiError.badRequest('The expiry date must be in the future.');
  }

  const coupon = await Coupon.create({ ...req.body, createdBy: req.user._id });
  return sendSuccess(res, { status: 201, message: `Coupon ${coupon.code} created.`, data: { coupon } });
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw ApiError.notFound('Coupon not found.');

  Object.entries(req.body).forEach(([key, value]) => {
    if (value !== undefined) coupon[key] = value;
  });

  await coupon.save();
  return sendSuccess(res, { message: 'Coupon updated.', data: { coupon } });
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw ApiError.notFound('Coupon not found.');
  return sendSuccess(res, { message: 'Coupon deleted.' });
});

export const toggleCouponStatus = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw ApiError.notFound('Coupon not found.');

  coupon.isActive = !coupon.isActive;
  await coupon.save();

  return sendSuccess(res, {
    message: coupon.isActive ? 'Coupon enabled.' : 'Coupon disabled.',
    data: { coupon },
  });
});

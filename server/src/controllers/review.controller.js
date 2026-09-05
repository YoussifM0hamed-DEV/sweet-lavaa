import mongoose from 'mongoose';
import { Review, Order, Product } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess, buildPaginationMeta } from '../utils/apiResponse.js';
import { ORDER_STATUS } from '../config/constants.js';

export const listProductReviews = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 8);

  const filter = { product: req.params.productId, status: 'approved' };
  if (req.query.rating) filter.rating = Number(req.query.rating);

  const [reviews, total, breakdown] = await Promise.all([
    Review.find(filter)
      .populate('user', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
    Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(String(req.params.productId)), status: 'approved' } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]),
  ]);

  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: breakdown.find((entry) => entry._id === stars)?.count || 0,
  }));

  return sendSuccess(res, {
    data: { reviews, distribution },
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

/** Only customers who actually received the product may review it. */
export const createReview = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.body.product).select('name');
  if (!product) throw ApiError.notFound('Product not found.');

  const purchase = await Order.findOne({
    user: req.user._id,
    status: ORDER_STATUS.DELIVERED,
    'items.product': product._id,
  }).select('_id');

  if (!purchase) {
    throw ApiError.forbidden('You can review a product once your order has been delivered.');
  }

  const existing = await Review.findOne({ product: product._id, user: req.user._id });
  if (existing) throw ApiError.conflict('You have already reviewed this product. You can edit your review instead.');

  const review = await Review.create({
    ...req.body,
    user: req.user._id,
    order: purchase._id,
    isVerifiedPurchase: true,
  });

  await review.populate('user', 'firstName lastName avatar');
  return sendSuccess(res, { status: 201, message: 'Thank you for your review!', data: { review } });
});

export const updateMyReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found.');
  if (String(review.user) !== String(req.user._id)) throw ApiError.forbidden('You can only edit your own review.');

  Object.entries(req.body).forEach(([key, value]) => {
    if (value !== undefined) review[key] = value;
  });
  await review.save();

  return sendSuccess(res, { message: 'Your review has been updated.', data: { review } });
});

export const deleteMyReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found.');
  if (String(review.user) !== String(req.user._id)) throw ApiError.forbidden('You can only delete your own review.');

  await Review.findOneAndDelete({ _id: review._id });
  return sendSuccess(res, { message: 'Your review has been removed.' });
});

export const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.user._id })
    .populate('product', 'name slug images')
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, { data: { reviews } });
});

export const adminListReviews = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);

  const filter = {};
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
  if (req.query.rating) filter.rating = Number(req.query.rating);

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('product', 'name slug images')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: { reviews }, meta: buildPaginationMeta({ page, limit, total }) });
});

export const moderateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found.');

  review.status = req.body.status;
  if (req.body.adminReply) {
    review.adminReply = { message: req.body.adminReply, repliedAt: new Date(), repliedBy: req.user._id };
  }
  await review.save();
  await Review.syncProductRating(review.product);

  return sendSuccess(res, { message: 'Review updated.', data: { review } });
});

export const adminDeleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findOneAndDelete({ _id: req.params.id });
  if (!review) throw ApiError.notFound('Review not found.');
  return sendSuccess(res, { message: 'Review deleted.' });
});

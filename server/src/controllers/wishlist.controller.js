import { Wishlist, Product } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { CARD_FIELDS } from './product.controller.js';

const getOrCreateWishlist = (userId) =>
  Wishlist.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { products: [] } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user._id);

  const products = await Product.find({
    _id: { $in: wishlist.products.map((entry) => entry.product) },
    isActive: true,
  })
    .select(CARD_FIELDS)
    .populate('category', 'name slug')
    .lean({ virtuals: true });

  // Newest saves first.
  const addedAt = new Map(wishlist.products.map((entry) => [String(entry.product), entry.addedAt]));
  const ordered = products
    .map((product) => ({ ...product, addedAt: addedAt.get(String(product._id)) }))
    .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

  return sendSuccess(res, { data: { products: ordered, count: ordered.length } });
});

/** Returns just the ids — used to paint the heart icons across the store. */
export const getWishlistIds = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user._id);
  return sendSuccess(res, { data: { ids: wishlist.products.map((entry) => String(entry.product)) } });
});

export const addToWishlist = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId).select('name isActive');
  if (!product || !product.isActive) throw ApiError.notFound('This product is not available.');

  const wishlist = await getOrCreateWishlist(req.user._id);
  const exists = wishlist.products.some((entry) => String(entry.product) === String(product._id));

  if (!exists) {
    if (wishlist.products.length >= 100) throw ApiError.badRequest('Your wishlist is full (100 items).');
    wishlist.products.push({ product: product._id });
    await wishlist.save();
  }

  return sendSuccess(res, {
    message: `${product.name} saved to your wishlist.`,
    data: { ids: wishlist.products.map((entry) => String(entry.product)) },
  });
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user._id);
  const before = wishlist.products.length;

  wishlist.products = wishlist.products.filter((entry) => String(entry.product) !== String(req.params.productId));
  if (wishlist.products.length === before) throw ApiError.notFound('This item is not in your wishlist.');

  await wishlist.save();
  return sendSuccess(res, {
    message: 'Removed from your wishlist.',
    data: { ids: wishlist.products.map((entry) => String(entry.product)) },
  });
});

export const clearWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user._id);
  wishlist.products = [];
  await wishlist.save();

  return sendSuccess(res, { message: 'Wishlist cleared.', data: { ids: [] } });
});

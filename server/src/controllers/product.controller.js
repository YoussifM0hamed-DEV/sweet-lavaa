import mongoose from 'mongoose';
import { Product, Category } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess, buildPaginationMeta } from '../utils/apiResponse.js';
import { escapeRegex } from '../utils/queryFeatures.js';

export const SORTS = {
  popular: { soldCount: -1, ratingAverage: -1, createdAt: -1 },
  newest: { createdAt: -1 },
  'price-asc': { effectivePrice: 1 },
  'price-desc': { effectivePrice: -1 },
  rating: { ratingAverage: -1, ratingCount: -1 },
  name: { name: 1 },
};

export const CARD_FIELDS =
  'name slug shortDescription price discountPrice stock lowStockThreshold trackInventory images category ratingAverage ratingCount soldCount isActive isFeatured isBestSeller isNewArrival isSeasonal tags variants createdAt';

const isTrue = (value) => value === 'true' || value === true || value === '1';

/**
 * Public catalogue listing. Filtering, sorting and pagination all run inside
 * MongoDB so large catalogues stay fast.
 */
export const listProducts = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const { page, limit, sort } = query;
  const skip = (page - 1) * limit;

  const match = { isActive: true };

  // Only surface products whose category is still published.
  const activeCategories = await Category.find({ isActive: true }).select('_id slug').lean();
  match.category = { $in: activeCategories.map((category) => category._id) };

  if (query.category) {
    const requested = String(query.category)
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const matched = activeCategories.filter(
      (category) => requested.includes(category.slug) || requested.includes(String(category._id)),
    );
    if (!matched.length) {
      return sendSuccess(res, { data: { products: [] }, meta: buildPaginationMeta({ page, limit, total: 0 }) });
    }
    match.category = { $in: matched.map((category) => category._id) };
  }

  if (query.search) {
    const safe = escapeRegex(query.search.trim());
    match.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { shortDescription: { $regex: safe, $options: 'i' } },
      { description: { $regex: safe, $options: 'i' } },
      { tags: { $regex: safe, $options: 'i' } },
    ];
  }

  if (query.tags) match.tags = { $in: query.tags.split(',').map((tag) => tag.trim().toLowerCase()) };
  if (query.rating) match.ratingAverage = { $gte: Number(query.rating) };
  if (isTrue(query.inStock)) match.$and = [{ $or: [{ trackInventory: false }, { stock: { $gt: 0 } }] }];
  if (isTrue(query.featured)) match.isFeatured = true;
  if (isTrue(query.bestSeller)) match.isBestSeller = true;
  if (isTrue(query.newArrival)) match.isNewArrival = true;

  const pipeline = [
    { $match: match },
    {
      $addFields: {
        effectivePrice: {
          $cond: [
            { $and: [{ $gt: ['$discountPrice', 0] }, { $lt: ['$discountPrice', '$price'] }] },
            '$discountPrice',
            '$price',
          ],
        },
      },
    },
  ];

  const priceMatch = {};
  if (query.minPrice !== undefined) priceMatch.$gte = Number(query.minPrice);
  if (query.maxPrice !== undefined) priceMatch.$lte = Number(query.maxPrice);
  if (Object.keys(priceMatch).length) pipeline.push({ $match: { effectivePrice: priceMatch } });

  if (isTrue(query.onSale)) {
    pipeline.push({
      $match: { $expr: { $and: [{ $gt: ['$discountPrice', 0] }, { $lt: ['$discountPrice', '$price'] }] } },
    });
  }

  pipeline.push(
    { $sort: SORTS[sort] || SORTS.popular },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
          { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              name: 1, slug: 1, shortDescription: 1, price: 1, discountPrice: 1, effectivePrice: 1,
              stock: 1, trackInventory: 1, lowStockThreshold: 1, images: 1, ratingAverage: 1,
              ratingCount: 1, soldCount: 1, isFeatured: 1, isBestSeller: 1, isNewArrival: 1,
              isSeasonal: 1, tags: 1, variants: 1, createdAt: 1,
              category: { _id: '$category._id', name: '$category.name', slug: '$category.slug' },
            },
          },
        ],
        total: [{ $count: 'count' }],
      },
    },
  );

  const [result] = await Product.aggregate(pipeline);
  const total = result.total[0]?.count || 0;

  return sendSuccess(res, {
    data: { products: result.data },
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate('category', 'name slug isActive')
    .lean({ virtuals: true });

  if (!product || !product.isActive || product.category?.isActive === false) {
    throw ApiError.notFound('This product is no longer available.');
  }

  // Fire and forget — a view counter must never slow down the response.
  Product.updateOne({ _id: product._id }, { $inc: { viewCount: 1 } }).catch(() => {});

  const related = await Product.find({
    _id: { $ne: product._id },
    category: product.category?._id,
    isActive: true,
  })
    .select(CARD_FIELDS)
    .populate('category', 'name slug')
    .sort({ soldCount: -1 })
    .limit(4)
    .lean({ virtuals: true });

  return sendSuccess(res, { data: { product, related } });
});

/** Curated homepage collections: featured, bestsellers, new, seasonal, sale. */
export const getProductCollection = asyncHandler(async (req, res) => {
  const limit = Math.min(20, Number(req.query.limit) || 8);
  const filterMap = {
    featured: { isFeatured: true },
    bestsellers: { isBestSeller: true },
    new: { isNewArrival: true },
    seasonal: { isSeasonal: true },
    sale: { $expr: { $and: [{ $gt: ['$discountPrice', 0] }, { $lt: ['$discountPrice', '$price'] }] } },
  };

  const filter = filterMap[req.params.collection];
  if (!filter) throw ApiError.notFound('Unknown product collection.');

  const products = await Product.find({ isActive: true, ...filter })
    .select(CARD_FIELDS)
    .populate('category', 'name slug')
    .sort(req.params.collection === 'new' ? { createdAt: -1 } : { soldCount: -1, ratingAverage: -1 })
    .limit(limit)
    .lean({ virtuals: true });

  return sendSuccess(res, { data: { products } });
});

/** Lightweight endpoint powering the navbar search dropdown. */
export const searchSuggestions = asyncHandler(async (req, res) => {
  const term = String(req.query.q || '').trim();
  if (term.length < 2) return sendSuccess(res, { data: { products: [], categories: [] } });

  const regex = { $regex: escapeRegex(term), $options: 'i' };

  const [products, categories] = await Promise.all([
    Product.find({ isActive: true, $or: [{ name: regex }, { tags: regex }] })
      .select('name slug price discountPrice images')
      .limit(6)
      .lean({ virtuals: true }),
    Category.find({ isActive: true, name: regex }).select('name slug image').limit(3).lean(),
  ]);

  return sendSuccess(res, { data: { products, categories } });
});

/** Resolves the client-stored "recently viewed" id list into product cards. */
export const getRecentlyViewed = asyncHandler(async (req, res) => {
  const ids = String(req.query.ids || '')
    .split(',')
    .filter((id) => mongoose.isValidObjectId(id))
    .slice(0, 8);

  if (!ids.length) return sendSuccess(res, { data: { products: [] } });

  const products = await Product.find({ _id: { $in: ids }, isActive: true })
    .select(CARD_FIELDS)
    .populate('category', 'name slug')
    .lean({ virtuals: true });

  const ordered = ids.map((id) => products.find((product) => String(product._id) === id)).filter(Boolean);
  return sendSuccess(res, { data: { products: ordered } });
});

/** Highest and lowest catalogue prices — drives the price filter slider. */
export const getPriceRange = asyncHandler(async (_req, res) => {
  const [range] = await Product.aggregate([
    { $match: { isActive: true } },
    {
      $addFields: {
        effectivePrice: {
          $cond: [
            { $and: [{ $gt: ['$discountPrice', 0] }, { $lt: ['$discountPrice', '$price'] }] },
            '$discountPrice',
            '$price',
          ],
        },
      },
    },
    { $group: { _id: null, min: { $min: '$effectivePrice' }, max: { $max: '$effectivePrice' } } },
  ]);

  return sendSuccess(res, {
    data: { min: Math.floor(range?.min || 0), max: Math.ceil(range?.max || 1000) },
  });
});

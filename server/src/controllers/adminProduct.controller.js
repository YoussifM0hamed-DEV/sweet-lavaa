import { Product, Category } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess, buildPaginationMeta } from '../utils/apiResponse.js';
import { uniqueSlug, toSlug } from '../utils/slug.js';
import { escapeRegex } from '../utils/queryFeatures.js';
import { uploadImages, deleteImage } from '../services/cloudinary.service.js';

const generateSku = (name) => `SL-${toSlug(name).slice(0, 12).toUpperCase().replace(/-/g, '')}-${Date.now().toString(36).toUpperCase().slice(-4)}`;

/** Admin listing — unlike the public one this shows inactive products too. */
export const adminListProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);

  const filter = {};
  if (req.query.search) {
    const regex = { $regex: escapeRegex(req.query.search), $options: 'i' };
    filter.$or = [{ name: regex }, { sku: regex }, { tags: regex }];
  }
  if (req.query.category) filter.category = req.query.category;
  if (req.query.status === 'active') filter.isActive = true;
  if (req.query.status === 'inactive') filter.isActive = false;
  if (req.query.stock === 'out') filter.stock = { $lte: 0 };
  if (req.query.stock === 'low') filter.$expr = { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] };

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    name: { name: 1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    'stock-asc': { stock: 1 },
    'sold-desc': { soldCount: -1 },
  };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort(sortMap[req.query.sort] || sortMap.newest)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean({ virtuals: true }),
    Product.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: { products }, meta: buildPaginationMeta({ page, limit, total }) });
});

export const adminGetProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug').lean({ virtuals: true });
  if (!product) throw ApiError.notFound('Product not found.');
  return sendSuccess(res, { data: { product } });
});

export const createProduct = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.body.category);
  if (!category) throw ApiError.badRequest('Please choose a valid category.');

  const payload = {
    ...req.body,
    slug: await uniqueSlug(Product, req.body.name),
    sku: req.body.sku?.trim() || generateSku(req.body.name),
  };

  const product = await Product.create(payload);
  await product.populate('category', 'name slug');

  return sendSuccess(res, { status: 201, message: 'Product created.', data: { product } });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found.');

  if (req.body.category && String(req.body.category) !== String(product.category)) {
    const category = await Category.findById(req.body.category);
    if (!category) throw ApiError.badRequest('Please choose a valid category.');
  }

  if (req.body.name && req.body.name !== product.name) {
    product.slug = await uniqueSlug(Product, req.body.name, product._id);
  }

  // Cross-field rule: a sale price must stay below the list price after a partial update.
  const nextPrice = req.body.price ?? product.price;
  const nextDiscount = req.body.discountPrice ?? product.discountPrice;
  if (nextDiscount > 0 && nextDiscount >= nextPrice) {
    throw ApiError.unprocessable('The discount price must be lower than the regular price.');
  }

  Object.entries(req.body).forEach(([key, value]) => {
    if (value !== undefined) product[key] = value;
  });

  await product.save();
  await product.populate('category', 'name slug');

  return sendSuccess(res, { message: 'Product updated.', data: { product } });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found.');

  await Promise.all(product.images.filter((image) => image.publicId).map((image) => deleteImage(image.publicId)));
  await product.deleteOne();

  return sendSuccess(res, { message: 'Product deleted.' });
});

export const toggleProductStatus = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found.');

  product.isActive = !product.isActive;
  await product.save();

  return sendSuccess(res, {
    message: product.isActive ? 'Product is now visible in the store.' : 'Product hidden from the store.',
    data: { product },
  });
});

export const uploadProductImages = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found.');
  if (!req.files?.length) throw ApiError.badRequest('Please choose at least one image.');
  if (product.images.length + req.files.length > 8) {
    throw ApiError.badRequest('A product can have up to 8 images.');
  }

  const uploaded = await uploadImages(req.files, { folder: 'products' });

  uploaded.forEach((image, index) => {
    product.images.push({
      url: image.url,
      publicId: image.publicId,
      alt: product.name,
      isPrimary: product.images.length === 0 && index === 0,
    });
  });

  await product.save();
  return sendSuccess(res, { message: 'Images uploaded.', data: { images: product.images } });
});

export const deleteProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found.');

  const image = product.images.id(req.params.imageId);
  if (!image) throw ApiError.notFound('Image not found.');

  const wasPrimary = image.isPrimary;
  if (image.publicId) await deleteImage(image.publicId);
  image.deleteOne();

  if (wasPrimary && product.images.length) product.images[0].isPrimary = true;
  await product.save();

  return sendSuccess(res, { message: 'Image removed.', data: { images: product.images } });
});

export const setPrimaryImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found.');

  let found = false;
  product.images.forEach((image) => {
    image.isPrimary = String(image._id) === String(req.params.imageId);
    if (image.isPrimary) found = true;
  });
  if (!found) throw ApiError.notFound('Image not found.');

  await product.save();
  return sendSuccess(res, { message: 'Main image updated.', data: { images: product.images } });
});

export const updateProductStock = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found.');

  product.stock = Math.max(0, Number(req.body.stock));
  if (req.body.lowStockThreshold !== undefined) {
    product.lowStockThreshold = Math.max(0, Number(req.body.lowStockThreshold));
  }
  await product.save();

  return sendSuccess(res, { message: 'Stock updated.', data: { product } });
});

/** Bulk stock edits from the inventory screen. */
export const bulkUpdateStock = asyncHandler(async (req, res) => {
  const updates = Array.isArray(req.body.updates) ? req.body.updates.slice(0, 200) : [];
  if (!updates.length) throw ApiError.badRequest('No stock changes were submitted.');

  const operations = updates
    .filter((update) => update.id && Number.isFinite(Number(update.stock)))
    .map((update) => ({
      updateOne: {
        filter: { _id: update.id },
        update: { $set: { stock: Math.max(0, Math.round(Number(update.stock))) } },
      },
    }));

  if (!operations.length) throw ApiError.badRequest('No valid stock changes were submitted.');
  const result = await Product.bulkWrite(operations);

  return sendSuccess(res, { message: `${result.modifiedCount} product(s) updated.`, data: { modified: result.modifiedCount } });
});

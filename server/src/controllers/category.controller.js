import { Category, Product } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { uniqueSlug } from '../utils/slug.js';
import { uploadImage, deleteImage } from '../services/cloudinary.service.js';

/** Public list — disabled categories never leave the building. */
export const listCategories = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.featured === 'true') filter.isFeatured = true;

  const categories = await Category.find(filter)
    .sort({ displayOrder: 1, name: 1 })
    .populate('productsCount')
    .lean({ virtuals: true });

  return sendSuccess(res, { data: { categories } });
});

export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true }).lean();
  if (!category) throw ApiError.notFound('This category is no longer available.');

  const productsCount = await Product.countDocuments({ category: category._id, isActive: true });
  return sendSuccess(res, { data: { category: { ...category, productsCount } } });
});

export const adminListCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find()
    .sort({ displayOrder: 1, name: 1 })
    .populate('productsCount')
    .lean({ virtuals: true });

  return sendSuccess(res, { data: { categories } });
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create({
    ...req.body,
    slug: await uniqueSlug(Category, req.body.name),
  });

  return sendSuccess(res, { status: 201, message: 'Category created.', data: { category } });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found.');

  if (req.body.name && req.body.name !== category.name) {
    category.slug = await uniqueSlug(Category, req.body.name, category._id);
  }

  Object.entries(req.body).forEach(([key, value]) => {
    if (value !== undefined) category[key] = value;
  });

  await category.save();
  return sendSuccess(res, { message: 'Category updated.', data: { category } });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found.');

  // Products would become unreachable without a category, so block the delete.
  const productsCount = await Product.countDocuments({ category: category._id });
  if (productsCount > 0) {
    throw ApiError.conflict(
      `This category still has ${productsCount} product(s). Move or delete them first, or disable the category instead.`,
    );
  }

  if (category.image?.publicId) await deleteImage(category.image.publicId);
  await category.deleteOne();

  return sendSuccess(res, { message: 'Category deleted.' });
});

export const toggleCategoryStatus = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found.');

  category.isActive = !category.isActive;
  await category.save();

  return sendSuccess(res, {
    message: category.isActive ? 'Category is now visible.' : 'Category hidden from the store.',
    data: { category },
  });
});

export const reorderCategories = asyncHandler(async (req, res) => {
  const operations = req.body.order.map((entry) => ({
    updateOne: { filter: { _id: entry.id }, update: { $set: { displayOrder: entry.displayOrder } } },
  }));

  await Category.bulkWrite(operations);
  const categories = await Category.find().sort({ displayOrder: 1, name: 1 }).lean();

  return sendSuccess(res, { message: 'Category order saved.', data: { categories } });
});

export const uploadCategoryImage = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found.');
  if (!req.file) throw ApiError.badRequest('Please choose an image to upload.');

  const uploaded = await uploadImage(req.file.buffer, { folder: 'categories' });
  if (category.image?.publicId) await deleteImage(category.image.publicId);

  category.image = { url: uploaded.url, publicId: uploaded.publicId, alt: category.name };
  await category.save();

  return sendSuccess(res, { message: 'Category image updated.', data: { category } });
});

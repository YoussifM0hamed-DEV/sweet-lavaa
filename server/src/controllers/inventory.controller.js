import { Product } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, buildPaginationMeta } from '../utils/apiResponse.js';
import { getInventorySnapshot } from '../services/inventory.service.js';
import { escapeRegex } from '../utils/queryFeatures.js';

export const getInventoryOverview = asyncHandler(async (_req, res) =>
  sendSuccess(res, { data: { snapshot: await getInventorySnapshot() } }),
);

/** Inventory table with the low / out-of-stock filters the admin screen offers. */
export const listInventory = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 25);

  const filter = {};
  if (req.query.search) filter.name = { $regex: escapeRegex(req.query.search), $options: 'i' };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.status === 'out') filter.stock = { $lte: 0 };
  if (req.query.status === 'low') {
    filter.$expr = { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] };
  }
  if (req.query.status === 'healthy') filter.$expr = { $gt: ['$stock', '$lowStockThreshold'] };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .select('name slug sku stock lowStockThreshold trackInventory price images category soldCount isActive')
      .populate('category', 'name')
      .sort({ stock: 1, name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean({ virtuals: true }),
    Product.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: { products }, meta: buildPaginationMeta({ page, limit, total }) });
});

export const getLowStockAlerts = asyncHandler(async (_req, res) => {
  const products = await Product.find({
    trackInventory: true,
    isActive: true,
    $expr: { $lte: ['$stock', '$lowStockThreshold'] },
  })
    .select('name slug stock lowStockThreshold images')
    .sort({ stock: 1 })
    .limit(20)
    .lean({ virtuals: true });

  return sendSuccess(res, { data: { products } });
});

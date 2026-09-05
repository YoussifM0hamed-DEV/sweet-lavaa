import { Product } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

/**
 * Atomically decrements stock for each order line.
 *
 * The conditional update (`stock: { $gte: quantity }`) makes the reservation
 * race-safe: two concurrent orders for the last item cannot both succeed.
 * If any line fails, previously applied lines are rolled back.
 */
export const reserveStock = async (items) => {
  const applied = [];

  try {
    for (const item of items) {
      const result = await Product.findOneAndUpdate(
        { _id: item.product, $or: [{ trackInventory: false }, { stock: { $gte: item.quantity } }] },
        { $inc: { stock: -item.quantity, soldCount: item.quantity } },
        { new: true },
      );

      if (!result) {
        throw ApiError.conflict(`"${item.name}" just sold out. Please update your cart and try again.`);
      }
      applied.push(item);
    }
    return true;
  } catch (error) {
    await releaseStock(applied);
    throw error;
  }
};

/** Returns stock to the catalogue (order cancelled / payment failed). */
export const releaseStock = async (items) => {
  await Promise.all(
    items.map((item) =>
      Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, soldCount: -item.quantity },
      }),
    ),
  );
};

/** Guards a stock value from going negative through admin edits. */
export const adjustStock = async (productId, delta, { absolute = false } = {}) => {
  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound('Product not found.');

  product.stock = absolute ? Math.max(0, Number(delta)) : Math.max(0, product.stock + Number(delta));
  await product.save();
  return product;
};

export const getInventorySnapshot = async () => {
  const [result] = await Product.aggregate([
    {
      $facet: {
        totals: [{ $group: { _id: null, products: { $sum: 1 }, units: { $sum: '$stock' } } }],
        outOfStock: [{ $match: { trackInventory: true, stock: { $lte: 0 } } }, { $count: 'count' }],
        lowStock: [
          { $match: { trackInventory: true, $expr: { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] } } },
          { $count: 'count' },
        ],
        stockValue: [{ $group: { _id: null, value: { $sum: { $multiply: ['$stock', '$price'] } } } }],
      },
    },
  ]);

  return {
    totalProducts: result.totals[0]?.products || 0,
    totalUnits: result.totals[0]?.units || 0,
    outOfStock: result.outOfStock[0]?.count || 0,
    lowStock: result.lowStock[0]?.count || 0,
    stockValue: Math.round(result.stockValue[0]?.value || 0),
  };
};

export default { reserveStock, releaseStock, adjustStock, getInventorySnapshot };

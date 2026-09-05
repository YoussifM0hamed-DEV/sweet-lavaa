import { Order, Product, User, Category, Review, ContactMessage } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { getInventorySnapshot } from '../services/inventory.service.js';
import { ORDER_STATUS, PAYMENT_STATUS, ROLES } from '../config/constants.js';

const PAID = { 'payment.status': PAYMENT_STATUS.PAID };

const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const percentChange = (current, previous) => {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

/** Headline KPI cards on the dashboard home. */
export const getOverview = asyncHandler(async (_req, res) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const today = startOfDay(now);

  const [
    revenueAll,
    revenueThisMonth,
    revenuePrevMonth,
    ordersTotal,
    ordersThisMonth,
    ordersPrevMonth,
    customersTotal,
    customersThisMonth,
    productsTotal,
    categoriesTotal,
    statusCounts,
    todayStats,
    inventory,
    pendingReviews,
    newMessages,
  ] = await Promise.all([
    Order.aggregate([{ $match: PAID }, { $group: { _id: null, total: { $sum: '$pricing.total' } } }]),
    Order.aggregate([{ $match: { ...PAID, createdAt: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$pricing.total' } } }]),
    Order.aggregate([
      { $match: { ...PAID, createdAt: { $gte: prevMonthStart, $lt: monthStart } } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } },
    ]),
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: monthStart } }),
    Order.countDocuments({ createdAt: { $gte: prevMonthStart, $lt: monthStart } }),
    User.countDocuments({ role: ROLES.CUSTOMER }),
    User.countDocuments({ role: ROLES.CUSTOMER, createdAt: { $gte: monthStart } }),
    Product.countDocuments(),
    Category.countDocuments(),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: { $cond: [{ $eq: ['$payment.status', 'paid'] }, '$pricing.total', 0] } } } },
    ]),
    getInventorySnapshot(),
    Review.countDocuments({ status: 'pending' }),
    ContactMessage.countDocuments({ status: 'new' }),
  ]);

  const byStatus = Object.fromEntries(statusCounts.map((entry) => [entry._id, entry.count]));
  const totalRevenue = Math.round(revenueAll[0]?.total || 0);
  const monthRevenue = Math.round(revenueThisMonth[0]?.total || 0);
  const prevRevenue = Math.round(revenuePrevMonth[0]?.total || 0);

  return sendSuccess(res, {
    data: {
      revenue: {
        total: totalRevenue,
        thisMonth: monthRevenue,
        change: percentChange(monthRevenue, prevRevenue),
        averageOrderValue: ordersTotal ? Math.round(totalRevenue / Math.max(1, ordersTotal)) : 0,
      },
      orders: {
        total: ordersTotal,
        thisMonth: ordersThisMonth,
        change: percentChange(ordersThisMonth, ordersPrevMonth),
        pending: byStatus[ORDER_STATUS.PENDING] || 0,
        confirmed: byStatus[ORDER_STATUS.CONFIRMED] || 0,
        preparing: byStatus[ORDER_STATUS.PREPARING] || 0,
        outForDelivery: byStatus[ORDER_STATUS.OUT_FOR_DELIVERY] || 0,
        delivered: byStatus[ORDER_STATUS.DELIVERED] || 0,
        cancelled: byStatus[ORDER_STATUS.CANCELLED] || 0,
      },
      customers: { total: customersTotal, thisMonth: customersThisMonth },
      catalogue: { products: productsTotal, categories: categoriesTotal },
      today: { orders: todayStats[0]?.orders || 0, revenue: Math.round(todayStats[0]?.revenue || 0) },
      inventory,
      attention: { pendingReviews, newMessages, lowStock: inventory.lowStock, outOfStock: inventory.outOfStock },
    },
  });
});

/** Revenue + order counts bucketed by day for the dashboard charts. */
export const getSalesSeries = asyncHandler(async (req, res) => {
  const days = Math.min(365, Math.max(7, Number(req.query.days) || 30));
  const from = startOfDay(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000));

  const series = await Order.aggregate([
    { $match: { createdAt: { $gte: from } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        orders: { $sum: 1 },
        revenue: { $sum: { $cond: [{ $eq: ['$payment.status', 'paid'] }, '$pricing.total', 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Fill gaps so the chart has one point per day.
  const map = new Map(series.map((entry) => [entry._id, entry]));
  const points = [];
  for (let index = 0; index < days; index += 1) {
    const date = new Date(from);
    date.setDate(from.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    points.push({
      date: key,
      orders: map.get(key)?.orders || 0,
      revenue: Math.round(map.get(key)?.revenue || 0),
    });
  }

  return sendSuccess(res, { data: { series: points, days } });
});

export const getTopProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(20, Number(req.query.limit) || 8);

  const products = await Order.aggregate([
    { $match: PAID },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        image: { $first: '$items.image' },
        unitsSold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.lineTotal' },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: limit },
    { $project: { name: 1, image: 1, unitsSold: 1, revenue: { $round: ['$revenue', 0] } } },
  ]);

  return sendSuccess(res, { data: { products } });
});

export const getRevenueByCategory = asyncHandler(async (_req, res) => {
  const categories = await Order.aggregate([
    { $match: PAID },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.category',
        name: { $first: '$items.categoryName' },
        revenue: { $sum: '$items.lineTotal' },
        units: { $sum: '$items.quantity' },
      },
    },
    { $sort: { revenue: -1 } },
    {
      // An empty string is as unusable as null for a chart legend, so treat both.
      $project: {
        name: { $cond: [{ $in: ['$name', [null, '']] }, 'Uncategorised', '$name'] },
        revenue: { $round: ['$revenue', 0] },
        units: 1,
      },
    },
  ]);

  return sendSuccess(res, { data: { categories } });
});

export const getRecentOrders = asyncHandler(async (req, res) => {
  const limit = Math.min(20, Number(req.query.limit) || 6);

  const orders = await Order.find()
    .select('orderNumber contact.fullName pricing.total status payment.status createdAt deliveryZone.name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return sendSuccess(res, { data: { orders } });
});

/** Zone performance table on the analytics page. */
export const getZonePerformance = asyncHandler(async (_req, res) => {
  const zones = await Order.aggregate([
    { $match: PAID },
    {
      $group: {
        _id: '$deliveryZone.zone',
        name: { $first: '$deliveryZone.name' },
        orders: { $sum: 1 },
        revenue: { $sum: '$pricing.total' },
        deliveryFees: { $sum: '$pricing.deliveryFee' },
      },
    },
    { $sort: { revenue: -1 } },
    {
      $project: {
        name: 1, orders: 1,
        revenue: { $round: ['$revenue', 0] },
        deliveryFees: { $round: ['$deliveryFees', 0] },
        averageOrder: { $round: [{ $divide: ['$revenue', '$orders'] }, 0] },
      },
    },
  ]);

  return sendSuccess(res, { data: { zones } });
});

/** New customers per month plus repeat-purchase rate. */
export const getCustomerInsights = asyncHandler(async (_req, res) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5, 1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [growth, repeat, topCustomers] = await Promise.all([
    User.aggregate([
      { $match: { role: ROLES.CUSTOMER, createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, customers: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: PAID },
      { $group: { _id: '$user', orders: { $sum: 1 } } },
      { $group: { _id: null, total: { $sum: 1 }, repeat: { $sum: { $cond: [{ $gt: ['$orders', 1] }, 1, 0] } } } },
    ]),
    Order.aggregate([
      { $match: PAID },
      { $group: { _id: '$user', name: { $first: '$contact.fullName' }, orders: { $sum: 1 }, spent: { $sum: '$pricing.total' } } },
      { $sort: { spent: -1 } },
      { $limit: 8 },
      { $project: { name: 1, orders: 1, spent: { $round: ['$spent', 0] } } },
    ]),
  ]);

  const stats = repeat[0] || { total: 0, repeat: 0 };

  return sendSuccess(res, {
    data: {
      growth: growth.map((entry) => ({ month: entry._id, customers: entry.customers })),
      buyers: stats.total,
      repeatBuyers: stats.repeat,
      repeatRate: stats.total ? Math.round((stats.repeat / stats.total) * 1000) / 10 : 0,
      topCustomers,
    },
  });
});

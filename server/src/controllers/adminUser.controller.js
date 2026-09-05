import { User, Order } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess, buildPaginationMeta } from '../utils/apiResponse.js';
import { escapeRegex } from '../utils/queryFeatures.js';
import { ROLES, STAFF_ROLES, ROLE_HIERARCHY, ROLE_PERMISSIONS } from '../config/constants.js';

/** Customer directory with live order totals. */
export const listCustomers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);

  const filter = { role: ROLES.CUSTOMER };
  if (req.query.search) {
    const regex = { $regex: escapeRegex(req.query.search), $options: 'i' };
    filter.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }, { phone: regex }];
  }
  if (req.query.status === 'active') filter.isActive = true;
  if (req.query.status === 'disabled') filter.isActive = false;

  const [customers, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  const ids = customers.map((customer) => customer._id);
  const stats = await Order.aggregate([
    { $match: { user: { $in: ids } } },
    {
      $group: {
        _id: '$user',
        orders: { $sum: 1 },
        spent: { $sum: { $cond: [{ $eq: ['$payment.status', 'paid'] }, '$pricing.total', 0] } },
        lastOrderAt: { $max: '$createdAt' },
      },
    },
  ]);
  const statsMap = new Map(stats.map((entry) => [String(entry._id), entry]));

  const enriched = customers.map((customer) => ({
    ...customer,
    fullName: `${customer.firstName} ${customer.lastName}`.trim(),
    ordersCount: statsMap.get(String(customer._id))?.orders || 0,
    totalSpent: Math.round(statsMap.get(String(customer._id))?.spent || 0),
    lastOrderAt: statsMap.get(String(customer._id))?.lastOrderAt || null,
  }));

  return sendSuccess(res, { data: { customers: enriched }, meta: buildPaginationMeta({ page, limit, total }) });
});

export const getCustomer = asyncHandler(async (req, res) => {
  const customer = await User.findById(req.params.id).lean();
  if (!customer) throw ApiError.notFound('Customer not found.');

  const [stats] = await Order.aggregate([
    { $match: { user: customer._id } },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        spent: { $sum: { $cond: [{ $eq: ['$payment.status', 'paid'] }, '$pricing.total', 0] } },
        lastOrderAt: { $max: '$createdAt' },
      },
    },
  ]);

  const recentOrders = await Order.find({ user: customer._id })
    .select('orderNumber pricing.total status payment.status createdAt')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return sendSuccess(res, {
    data: {
      customer: {
        ...customer,
        fullName: `${customer.firstName} ${customer.lastName}`.trim(),
        ordersCount: stats?.orders || 0,
        totalSpent: Math.round(stats?.spent || 0),
        lastOrderAt: stats?.lastOrderAt || null,
      },
      recentOrders,
    },
  });
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');
  if (String(user._id) === String(req.user._id)) throw ApiError.badRequest('You cannot disable your own account.');

  // Nobody may disable an account that outranks them.
  if (ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[req.user.role] && user.role !== ROLES.CUSTOMER) {
    throw ApiError.forbidden('You cannot modify an account at or above your own role.');
  }

  user.isActive = !user.isActive;
  if (!user.isActive) user.tokenVersion += 1;
  await user.save({ validateBeforeSave: false });

  return sendSuccess(res, {
    message: user.isActive ? 'Account enabled.' : 'Account disabled.',
    data: { user },
  });
});

/** Staff directory for the Users & Roles screen. */
export const listStaff = asyncHandler(async (req, res) => {
  const filter = { role: { $in: STAFF_ROLES } };
  if (req.query.search) {
    const regex = { $regex: escapeRegex(req.query.search), $options: 'i' };
    filter.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }];
  }

  const staff = await User.find(filter).sort({ createdAt: -1 }).lean({ virtuals: true });

  return sendSuccess(res, {
    data: {
      staff: staff.map((member) => ({
        ...member,
        fullName: `${member.firstName} ${member.lastName}`.trim(),
        permissions: ROLE_PERMISSIONS[member.role] || [],
      })),
      roles: STAFF_ROLES.map((role) => ({ role, permissions: ROLE_PERMISSIONS[role] })),
    },
  });
});

export const createStaff = asyncHandler(async (req, res) => {
  if (ROLE_HIERARCHY[req.body.role] >= ROLE_HIERARCHY[req.user.role]) {
    throw ApiError.forbidden('You cannot create an account at or above your own role.');
  }

  const existing = await User.findOne({ email: req.body.email });
  if (existing) throw ApiError.conflict('An account with this email already exists.');

  const user = await User.create({ ...req.body, isEmailVerified: true });
  return sendSuccess(res, { status: 201, message: 'Team member added.', data: { user } });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');
  if (String(user._id) === String(req.user._id)) throw ApiError.badRequest('You cannot change your own role.');

  // A user can neither promote someone above themselves nor demote a peer/superior.
  if (ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[req.user.role]) {
    throw ApiError.forbidden('You cannot modify an account at or above your own role.');
  }
  if (ROLE_HIERARCHY[req.body.role] >= ROLE_HIERARCHY[req.user.role]) {
    throw ApiError.forbidden('You cannot grant a role at or above your own.');
  }

  user.role = req.body.role;
  if (req.body.extraPermissions) user.extraPermissions = req.body.extraPermissions;
  // Force a fresh sign-in so the new role takes effect immediately.
  user.tokenVersion += 1;
  await user.save({ validateBeforeSave: false });

  return sendSuccess(res, { message: 'Role updated.', data: { user } });
});

export const deleteStaff = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');
  if (String(user._id) === String(req.user._id)) throw ApiError.badRequest('You cannot remove your own account.');
  if (ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[req.user.role]) {
    throw ApiError.forbidden('You cannot remove an account at or above your own role.');
  }

  // Demote rather than delete so historical records keep their author.
  user.role = ROLES.CUSTOMER;
  user.extraPermissions = [];
  user.tokenVersion += 1;
  await user.save({ validateBeforeSave: false });

  return sendSuccess(res, { message: 'Team member removed from staff.' });
});

export const getAvailableRoles = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    data: {
      roles: Object.values(ROLES)
        .filter((role) => ROLE_HIERARCHY[role] < ROLE_HIERARCHY[req.user.role] || role === ROLES.CUSTOMER)
        .map((role) => ({ role, permissions: ROLE_PERMISSIONS[role] || [] })),
    },
  }),
);

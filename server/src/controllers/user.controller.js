import { User, Order } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { publicUser } from './auth.controller.js';
import { uploadImage, deleteImage } from '../services/cloudinary.service.js';

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  ['firstName', 'lastName', 'phone'].forEach((field) => {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  });

  await user.save();
  return sendSuccess(res, { message: 'Your profile has been updated.', data: { user: publicUser(user) } });
});

export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Please choose an image to upload.');

  const user = await User.findById(req.user._id);
  const uploaded = await uploadImage(req.file.buffer, { folder: 'avatars' });

  if (user.avatar?.publicId) await deleteImage(user.avatar.publicId);
  user.avatar = { url: uploaded.url, publicId: uploaded.publicId };
  await user.save();

  return sendSuccess(res, { message: 'Your photo has been updated.', data: { user: publicUser(user) } });
});

export const listAddresses = asyncHandler(async (req, res) =>
  sendSuccess(res, { data: { addresses: req.user.addresses } }),
);

export const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user.addresses.length >= 10) throw ApiError.badRequest('You can save up to 10 addresses.');

  if (req.body.isDefault || user.addresses.length === 0) {
    user.addresses.forEach((address) => {
      address.isDefault = false;
    });
    req.body.isDefault = true;
  }

  user.addresses.push(req.body);
  await user.save();

  return sendSuccess(res, { status: 201, message: 'Address saved.', data: { addresses: user.addresses } });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.id);
  if (!address) throw ApiError.notFound('Address not found.');

  if (req.body.isDefault) {
    user.addresses.forEach((entry) => {
      entry.isDefault = false;
    });
  }
  address.set(req.body);
  await user.save();

  return sendSuccess(res, { message: 'Address updated.', data: { addresses: user.addresses } });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.id);
  if (!address) throw ApiError.notFound('Address not found.');

  const wasDefault = address.isDefault;
  address.deleteOne();

  if (wasDefault && user.addresses.length) user.addresses[0].isDefault = true;
  await user.save();

  return sendSuccess(res, { message: 'Address removed.', data: { addresses: user.addresses } });
});

export const setDefaultAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.id);
  if (!address) throw ApiError.notFound('Address not found.');

  user.addresses.forEach((entry) => {
    entry.isDefault = String(entry._id) === String(address._id);
  });
  await user.save();

  return sendSuccess(res, { message: 'Default address updated.', data: { addresses: user.addresses } });
});

export const getMyStats = asyncHandler(async (req, res) => {
  const [stats] = await Order.aggregate([
    { $match: { user: req.user._id } },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        spent: { $sum: { $cond: [{ $eq: ['$payment.status', 'paid'] }, '$pricing.total', 0] } },
        pending: { $sum: { $cond: [{ $in: ['$status', ['pending', 'confirmed', 'preparing', 'out_for_delivery']] }, 1, 0] } },
      },
    },
  ]);

  return sendSuccess(res, {
    data: {
      ordersCount: stats?.orders || 0,
      totalSpent: Math.round(stats?.spent || 0),
      activeOrders: stats?.pending || 0,
      savedAddresses: req.user.addresses.length,
    },
  });
});

export const deleteMyAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  // Soft delete keeps order history intact for accounting.
  user.isActive = false;
  user.tokenVersion += 1;
  await user.save({ validateBeforeSave: false });

  return sendSuccess(res, { message: 'Your account has been deactivated.' });
});

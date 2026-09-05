import { User, Cart, Wishlist } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess, sendCreated } from '../utils/apiResponse.js';
import { signAccessToken, setAuthCookie, clearAuthCookie, createRandomToken, hashToken } from '../utils/token.js';
import { verifyGoogleIdToken } from '../services/google.service.js';
import { ROLES } from '../config/constants.js';
import logger from '../utils/logger.js';

const publicUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  fullName: `${user.firstName} ${user.lastName}`.trim(),
  email: user.email,
  phone: user.phone,
  avatar: user.avatar?.url || '',
  role: user.role,
  permissions: user.permissions,
  provider: user.provider,
  isEmailVerified: user.isEmailVerified,
  addresses: user.addresses,
  stats: user.stats,
  createdAt: user.createdAt,
});

const issueSession = (res, user, { status = 200, message } = {}) => {
  const token = signAccessToken(user);
  setAuthCookie(res, token);
  return sendSuccess(res, { status, message, data: { user: publicUser(user), token } });
};

/** Ensures a new account has its cart and wishlist containers ready. */
const bootstrapUser = async (userId) => {
  await Promise.all([
    Cart.findOneAndUpdate({ user: userId }, { $setOnInsert: { items: [] } }, { upsert: true }),
    Wishlist.findOneAndUpdate({ user: userId }, { $setOnInsert: { products: [] } }, { upsert: true }),
  ]);
};

export const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with this email already exists. Try signing in instead.');

  const user = await User.create({
    firstName,
    lastName,
    email,
    phone: phone || '',
    password,
    role: ROLES.CUSTOMER,
    provider: 'local',
  });

  await bootstrapUser(user._id);
  return issueSession(res, user, { status: 201, message: 'Welcome to Sweet Lava! Your account is ready.' });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  // A single generic message avoids leaking which accounts exist.
  if (!user || !user.password) throw ApiError.unauthorized('Invalid email or password.');

  const matches = await user.comparePassword(password);
  if (!matches) throw ApiError.unauthorized('Invalid email or password.');
  if (!user.isActive) throw ApiError.forbidden('This account has been disabled. Please contact support.');

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  await bootstrapUser(user._id);

  return issueSession(res, user, { message: `Welcome back, ${user.firstName}!` });
});

export const googleAuth = asyncHandler(async (req, res) => {
  const profile = await verifyGoogleIdToken(req.body.credential);

  let user = await User.findOne({ $or: [{ googleId: profile.googleId }, { email: profile.email }] });

  if (user) {
    if (!user.isActive) throw ApiError.forbidden('This account has been disabled. Please contact support.');
    // Link the Google identity to an existing email/password account.
    if (!user.googleId) {
      user.googleId = profile.googleId;
      if (!user.avatar?.url && profile.avatar) user.avatar = { url: profile.avatar, publicId: '' };
      user.isEmailVerified = true;
    }
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });
  } else {
    user = await User.create({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      googleId: profile.googleId,
      avatar: { url: profile.avatar, publicId: '' },
      provider: 'google',
      role: ROLES.CUSTOMER,
      isEmailVerified: true,
      lastLoginAt: new Date(),
    });
  }

  await bootstrapUser(user._id);
  return issueSession(res, user, { message: `Welcome, ${user.firstName}!` });
});

export const getMe = asyncHandler(async (req, res) =>
  sendSuccess(res, { data: { user: publicUser(req.user) } }),
);

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  return sendSuccess(res, { message: 'You have been signed out.' });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!user.password) {
    throw ApiError.badRequest('Your account uses Google sign-in, so there is no password to change.');
  }

  const matches = await user.comparePassword(req.body.currentPassword);
  if (!matches) throw ApiError.badRequest('Your current password is incorrect.');

  user.password = req.body.newPassword;
  await user.save();

  // The pre-save hook bumped tokenVersion, so a fresh token must be issued.
  return issueSession(res, user, { message: 'Your password has been updated.' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  // Always answer identically so the endpoint cannot be used to enumerate emails.
  const genericResponse = () =>
    sendSuccess(res, { message: 'If an account exists for this email, a reset link is on its way.' });

  if (!user || !user.isActive) return genericResponse();

  const { raw, hashed } = createRandomToken();
  user.passwordResetToken = hashed;
  user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  // Wire an email provider here. In development the link is logged instead.
  logger.info(`Password reset link: ${process.env.CLIENT_URL}/reset-password/${raw}`);

  return genericResponse();
});

export const resetPassword = asyncHandler(async (req, res) => {
  const hashed = hashToken(req.params.token);

  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: new Date() },
  }).select('+password');

  if (!user) throw ApiError.badRequest('This reset link is invalid or has expired.');

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return issueSession(res, user, { message: 'Your password has been reset.' });
});

export { publicUser };

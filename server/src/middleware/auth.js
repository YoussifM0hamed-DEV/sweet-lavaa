import { User } from '../models/index.js';
import { verifyAccessToken, AUTH_COOKIE_NAME } from '../utils/token.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ROLE_PERMISSIONS, STAFF_ROLES } from '../config/constants.js';

const extractToken = (req) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  if (req.cookies?.[AUTH_COOKIE_NAME]) return req.cookies[AUTH_COOKIE_NAME];
  return null;
};

const loadUser = async (token) => {
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    if (error.name === 'TokenExpiredError') throw ApiError.unauthorized('Your session has expired. Please sign in again.');
    throw ApiError.unauthorized('Invalid session. Please sign in again.');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('This account no longer exists.');
  if (!user.isActive) throw ApiError.forbidden('This account has been disabled. Please contact support.');
  if ((payload.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
    throw ApiError.unauthorized('Your session is no longer valid. Please sign in again.');
  }
  return user;
};

/** Rejects the request when no valid session is present. */
export const protect = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('You need to sign in to continue.');
  req.user = await loadUser(token);
  next();
});

/** Attaches req.user when a session exists but never blocks the request. */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    req.user = await loadUser(token);
  } catch {
    req.user = undefined;
  }
  return next();
});

/** Route guard by role name. */
export const restrictTo = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
  return next();
};

/** Route guard by granular permission — preferred over restrictTo for admin APIs. */
export const requirePermission = (...permissions) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  const granted = new Set([...(ROLE_PERMISSIONS[req.user.role] || []), ...(req.user.extraPermissions || [])]);
  const ok = permissions.every((permission) => granted.has(permission));
  if (!ok) return next(ApiError.forbidden('You do not have permission to perform this action.'));
  return next();
};

/** Blocks every non-staff account from the admin surface. */
export const requireStaff = (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!STAFF_ROLES.includes(req.user.role)) return next(ApiError.forbidden());
  return next();
};

export default { protect, optionalAuth, restrictTo, requirePermission, requireStaff };

import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

/** Converts driver/library specific errors into safe, user friendly ApiErrors. */
const normalise = (error) => {
  if (error instanceof ApiError) return error;

  if (error.name === 'CastError') {
    return ApiError.badRequest('The requested item could not be found.');
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'value';
    const labels = { email: 'An account with this email already exists.', code: 'This coupon code is already in use.', slug: 'An item with this name already exists.', name: 'An item with this name already exists.', sku: 'This SKU is already in use.' };
    return ApiError.conflict(labels[field] || 'This value is already taken.');
  }

  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors || {}).map((item) => ({ field: item.path, message: item.message }));
    return ApiError.unprocessable(details[0]?.message || 'Please check the submitted values.', details);
  }

  if (error.name === 'JsonWebTokenError') return ApiError.unauthorized('Invalid session. Please sign in again.');
  if (error.name === 'TokenExpiredError') return ApiError.unauthorized('Your session has expired. Please sign in again.');
  if (error.type === 'entity.too.large') return ApiError.badRequest('The uploaded content is too large.');
  if (error.code === 'LIMIT_FILE_SIZE') return ApiError.badRequest('Each image must be smaller than 5 MB.');
  if (error.code === 'LIMIT_UNEXPECTED_FILE') return ApiError.badRequest('Too many files were uploaded at once.');

  return null;
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (error, req, res, _next) => {
  const known = normalise(error);
  const statusCode = known?.statusCode || error.statusCode || 500;
  const message = known?.message || (statusCode === 500 ? 'Something went wrong on our side. Please try again.' : error.message);

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} → ${error.message}`);
    if (!env.isProd) console.error(error.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(known?.details ? { errors: known.details } : {}),
    // Stack traces are development-only and never leak to customers.
    ...(env.isProd ? {} : { stack: error.stack }),
  });
};

export default errorHandler;

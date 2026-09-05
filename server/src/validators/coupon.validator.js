import { z } from 'zod';
import { objectId, numeric } from './common.js';
import { COUPON_TYPES } from '../config/constants.js';

const couponShape = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, 'Coupon code must be at least 3 characters.')
    .max(30)
    .regex(/^[A-Z0-9_-]+$/, 'Coupon codes may only contain letters, numbers, hyphens and underscores.'),
  description: z.string().trim().max(240).optional().default(''),
  discountType: z.enum(Object.values(COUPON_TYPES)),
  discountValue: numeric('Discount value', { min: 0 }),
  minOrderAmount: numeric('Minimum order amount', { min: 0 }).optional().default(0),
  maxDiscountAmount: numeric('Maximum discount', { min: 0 }).optional().default(0),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date({ invalid_type_error: 'An expiry date is required.' }),
  usageLimit: numeric('Usage limit', { min: 0 }).optional().default(0),
  perUserLimit: numeric('Per-user limit', { min: 0 }).optional().default(1),
  applicableCategories: z.array(objectId).optional().default([]),
  applicableProducts: z.array(objectId).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

const percentageRule = (data) =>
  data.discountType !== COUPON_TYPES.PERCENTAGE || Number(data.discountValue) <= 100;

export const couponBodySchema = couponShape.refine(percentageRule, {
  message: 'A percentage discount cannot exceed 100 percent.',
  path: ['discountValue'],
});

export const updateCouponSchema = couponShape.partial().refine(
  (data) => data.discountType === undefined || data.discountValue === undefined || percentageRule(data),
  { message: 'A percentage discount cannot exceed 100 percent.', path: ['discountValue'] },
);

export const applyCouponSchema = z.object({
  code: z.string().trim().min(1, 'Please enter a coupon code.').max(30),
});

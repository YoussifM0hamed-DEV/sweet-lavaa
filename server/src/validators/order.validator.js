import { z } from 'zod';
import { objectId, optionalObjectId, email, phone } from './common.js';
import { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHODS } from '../config/constants.js';

/**
 * Note what is intentionally absent: prices, discounts, delivery fees and
 * totals. The server recalculates all of them from the catalogue.
 */
export const createOrderSchema = z.object({
  contact: z.object({
    fullName: z.string().trim().min(2, 'Full name is required.').max(120),
    email,
    phone,
  }),
  shippingAddress: z.object({
    governorate: z.string().trim().max(80).optional().default(''),
    city: z.string().trim().max(80).optional().default(''),
    district: z.string().trim().max(80).optional().default(''),
    street: z.string().trim().min(2, 'Street address is required.').max(200),
    building: z.string().trim().max(40).optional().default(''),
    apartment: z.string().trim().max(40).optional().default(''),
    floor: z.string().trim().max(40).optional().default(''),
    notes: z.string().trim().max(400).optional().default(''),
  }),
  deliveryZone: objectId,
  couponCode: z.string().trim().max(30).optional().nullable(),
  paymentMethod: z.enum(Object.values(PAYMENT_METHODS)).optional().default(PAYMENT_METHODS.CARD),
  customerNotes: z.string().trim().max(500).optional().default(''),
  saveAddress: z.boolean().optional().default(false),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(Object.values(ORDER_STATUS)),
  note: z.string().trim().max(300).optional().default(''),
});

export const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(Object.values(PAYMENT_STATUS)),
  note: z.string().trim().max(300).optional().default(''),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(15),
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  search: z.string().trim().optional(),
  zone: optionalObjectId,
  from: z.string().optional(),
  to: z.string().optional(),
  sort: z.enum(['newest', 'oldest', 'total-desc', 'total-asc']).optional().default('newest'),
});

export const cancelOrderSchema = z.object({
  reason: z.string().trim().max(300).optional().default(''),
});

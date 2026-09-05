import { z } from 'zod';
import { objectId, optionalObjectId } from './common.js';

export const addItemSchema = z.object({
  product: objectId,
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1.').max(99).optional().default(1),
  variantId: optionalObjectId,
});

export const updateItemSchema = z.object({
  quantity: z.coerce.number().int().min(0).max(99),
  variantId: optionalObjectId,
});

export const mergeCartSchema = z.object({
  items: z
    .array(
      z.object({
        product: objectId,
        quantity: z.coerce.number().int().min(1).max(99),
        variantId: optionalObjectId,
      }),
    )
    .max(60),
});

export const quoteSchema = z.object({
  couponCode: z.string().trim().max(30).optional().nullable(),
  deliveryZone: optionalObjectId,
});

export default { addItemSchema, updateItemSchema, mergeCartSchema, quoteSchema };

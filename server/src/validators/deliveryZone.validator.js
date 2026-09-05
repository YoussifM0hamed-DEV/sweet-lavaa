import { z } from 'zod';
import { numeric } from './common.js';

export const deliveryZoneBodySchema = z.object({
  name: z.string().trim().min(2, 'Area name is required.').max(80),
  governorate: z.string().trim().max(80).optional().default('Cairo'),
  deliveryFee: numeric('Delivery fee', { min: 0 }),
  freeDeliveryThreshold: numeric('Free delivery threshold', { min: 0 }).optional().default(0),
  estimatedTime: z.string().trim().max(60).optional().default('1-2 Days'),
  minimumOrderAmount: numeric('Minimum order amount', { min: 0 }).optional().default(0),
  displayOrder: numeric('Display order').optional().default(0),
  isActive: z.boolean().optional().default(true),
  notes: z.string().trim().max(300).optional().default(''),
});

export const updateDeliveryZoneSchema = deliveryZoneBodySchema.partial();

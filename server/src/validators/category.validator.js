import { z } from 'zod';
import { objectId, numeric } from './common.js';

export const categoryBodySchema = z.object({
  name: z.string().trim().min(2, 'Category name is required.').max(80),
  description: z.string().trim().max(500).optional().default(''),
  tagline: z.string().trim().max(120).optional().default(''),
  image: z
    .object({
      url: z.string().url().or(z.literal('')).optional().default(''),
      publicId: z.string().optional().default(''),
      alt: z.string().optional().default(''),
    })
    .optional(),
  displayOrder: numeric('Display order').optional().default(0),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  seo: z.object({ title: z.string().optional(), description: z.string().optional() }).optional(),
});

export const updateCategorySchema = categoryBodySchema.partial();

export const reorderCategoriesSchema = z.object({
  order: z.array(z.object({ id: objectId, displayOrder: z.coerce.number().int() })).min(1),
});

export default { categoryBodySchema, updateCategorySchema, reorderCategoriesSchema };

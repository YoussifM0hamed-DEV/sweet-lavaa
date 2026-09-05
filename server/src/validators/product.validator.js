import { z } from 'zod';
import { objectId, numeric } from './common.js';

const imageInput = z.object({
  url: z.string().url('Each image needs a valid URL.'),
  publicId: z.string().optional().default(''),
  alt: z.string().optional().default(''),
  isPrimary: z.boolean().optional().default(false),
});

const variantInput = z.object({
  _id: objectId.optional(),
  name: z.string().trim().min(1, 'Option name is required.'),
  priceModifier: numeric('Price modifier').optional().default(0),
  stock: numeric('Stock').optional().default(0),
  isAvailable: z.boolean().optional().default(true),
});

const productBase = {
  name: z.string().trim().min(2, 'Product name is required.').max(140),
  shortDescription: z.string().trim().max(220).optional().default(''),
  description: z.string().trim().max(5000).optional().default(''),
  category: objectId,
  tags: z.array(z.string().trim()).optional().default([]),
  price: numeric('Price', { min: 0 }),
  discountPrice: numeric('Discount price', { min: 0 }).optional().default(0),
  costPrice: numeric('Cost price', { min: 0 }).optional().default(0),
  stock: numeric('Stock', { min: 0 }).optional().default(0),
  lowStockThreshold: numeric('Low stock threshold', { min: 0 }).optional().default(5),
  trackInventory: z.boolean().optional().default(true),
  images: z.array(imageInput).optional().default([]),
  variants: z.array(variantInput).optional().default([]),
  ingredients: z.array(z.string().trim()).optional().default([]),
  allergens: z.array(z.string().trim()).optional().default([]),
  weight: z.string().trim().max(60).optional().default(''),
  preparationTime: z.string().trim().max(60).optional().default(''),
  sku: z.string().trim().max(40).optional(),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  isBestSeller: z.boolean().optional().default(false),
  isNewArrival: z.boolean().optional().default(false),
  isSeasonal: z.boolean().optional().default(false),
  nutrition: z
    .object({
      calories: z.coerce.number().nullable().optional(),
      servingSize: z.string().optional().default(''),
    })
    .optional(),
  seo: z
    .object({ title: z.string().max(70).optional().default(''), description: z.string().max(180).optional().default('') })
    .optional(),
};

// A sale price above the list price would show a negative discount to customers.
const discountRule = (data) =>
  !data.discountPrice || data.discountPrice === 0 || Number(data.discountPrice) < Number(data.price);

export const createProductSchema = z
  .object(productBase)
  .refine(discountRule, { message: 'The discount price must be lower than the regular price.', path: ['discountPrice'] });

export const updateProductSchema = z
  .object(
    Object.fromEntries(Object.entries(productBase).map(([key, schema]) => [key, schema.optional()])),
  )
  .refine((data) => (data.price === undefined || data.discountPrice === undefined ? true : discountRule(data)), {
    message: 'The discount price must be lower than the regular price.',
    path: ['discountPrice'],
  });

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(60).optional().default(12),
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  sort: z
    .enum(['popular', 'newest', 'price-asc', 'price-desc', 'rating', 'name'])
    .optional()
    .default('popular'),
  inStock: z.string().optional(),
  onSale: z.string().optional(),
  featured: z.string().optional(),
  bestSeller: z.string().optional(),
  newArrival: z.string().optional(),
  tags: z.string().optional(),
});

export const stockUpdateSchema = z.object({
  stock: numeric('Stock', { min: 0 }),
  lowStockThreshold: numeric('Low stock threshold', { min: 0 }).optional(),
});

export default { createProductSchema, updateProductSchema, productQuerySchema, stockUpdateSchema };

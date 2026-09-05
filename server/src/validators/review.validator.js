import { z } from 'zod';
import { objectId } from './common.js';

export const createReviewSchema = z.object({
  product: objectId,
  rating: z.coerce.number().int().min(1, 'Please choose a rating.').max(5),
  title: z.string().trim().max(120).optional().default(''),
  comment: z.string().trim().min(5, 'Please write at least a few words.').max(1500),
});

export const updateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  title: z.string().trim().max(120).optional(),
  comment: z.string().trim().min(5).max(1500).optional(),
});

export const moderateReviewSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
  adminReply: z.string().trim().max(800).optional(),
});

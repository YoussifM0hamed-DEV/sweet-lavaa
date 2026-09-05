import { z } from 'zod';

export const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'A valid identifier is required.');

export const optionalObjectId = z
  .union([objectId, z.literal(''), z.null()])
  .optional()
  .transform((value) => (value === '' || value === null ? undefined : value));

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email address is required.')
  .email('Please enter a valid email address.');

export const phone = z
  .string()
  .trim()
  .regex(/^[+0-9][0-9\s-]{6,19}$/, 'Please enter a valid phone number.');

export const password = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(72, 'Password must be at most 72 characters.')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter.')
  .regex(/[0-9]/, 'Password must contain at least one number.');

export const name = (label) =>
  z.string().trim().min(2, `${label} must be at least 2 characters.`).max(60, `${label} is too long.`);

export const boolish = z
  .union([z.boolean(), z.string(), z.number()])
  .transform((value) => value === true || value === 'true' || value === 1 || value === '1');

export const numeric = (label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) =>
  z.coerce
    .number({ invalid_type_error: `${label} must be a number.` })
    .min(min, `${label} must be at least ${min}.`)
    .max(max, `${label} is too large.`);

export const idParams = z.object({ id: objectId });
export const slugParams = z.object({ slug: z.string().trim().min(1) });

export default { objectId, optionalObjectId, email, phone, password, name, boolish, numeric, idParams, slugParams };

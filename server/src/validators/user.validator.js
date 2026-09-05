import { z } from 'zod';
import { name, phone, optionalObjectId } from './common.js';
import { ROLES } from '../config/constants.js';

export const updateProfileSchema = z.object({
  firstName: name('First name').optional(),
  lastName: name('Last name').optional(),
  phone: phone.optional().or(z.literal('')),
});

export const addressSchema = z.object({
  label: z.string().trim().max(40).optional().default('Home'),
  fullName: z.string().trim().min(2, 'Recipient name is required.').max(120),
  phone,
  governorate: z.string().trim().max(80).optional().default(''),
  deliveryZone: optionalObjectId,
  city: z.string().trim().max(80).optional().default(''),
  district: z.string().trim().max(80).optional().default(''),
  street: z.string().trim().min(2, 'Street address is required.').max(200),
  building: z.string().trim().max(40).optional().default(''),
  apartment: z.string().trim().max(40).optional().default(''),
  floor: z.string().trim().max(40).optional().default(''),
  notes: z.string().trim().max(400).optional().default(''),
  isDefault: z.boolean().optional().default(false),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(Object.values(ROLES), { errorMap: () => ({ message: 'Please choose a valid role.' }) }),
  extraPermissions: z.array(z.string()).optional(),
});

export const toggleActiveSchema = z.object({ isActive: z.boolean() });

export const createStaffSchema = z.object({
  firstName: name('First name'),
  lastName: name('Last name'),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address.'),
  phone: phone.optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  role: z.enum(Object.values(ROLES)),
});

export default { updateProfileSchema, addressSchema, updateUserRoleSchema, toggleActiveSchema, createStaffSchema };

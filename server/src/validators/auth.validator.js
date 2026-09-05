import { z } from 'zod';
import { email, password, phone, name } from './common.js';

export const registerSchema = z
  .object({
    firstName: name('First name'),
    lastName: name('Last name'),
    email,
    phone: phone.optional().or(z.literal('')),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required.'),
  rememberMe: z.boolean().optional().default(false),
});

export const googleSchema = z.object({
  credential: z.string().min(10, 'A Google credential is required.'),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Your current password is required.'),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export default { registerSchema, loginSchema, googleSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema };

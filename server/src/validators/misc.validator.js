import { z } from 'zod';
import { email, phone } from './common.js';

export const newsletterSchema = z.object({
  email,
  source: z.string().trim().max(40).optional().default('homepage'),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Your name is required.').max(120),
  email,
  phone: phone.optional().or(z.literal('')),
  subject: z.string().trim().max(160).optional().default('General enquiry'),
  message: z.string().trim().min(10, 'Please tell us a little more.').max(2000),
});

const media = z.object({ url: z.string().optional(), publicId: z.string().optional() }).optional();

export const settingsSchema = z.object({
  store: z
    .object({
      name: z.string().trim().min(1).max(80).optional(),
      tagline: z.string().trim().max(160).optional(),
      description: z.string().trim().max(1000).optional(),
      logo: media,
      favicon: media,
    })
    .optional(),
  contact: z
    .object({
      phone: z.string().trim().max(30).optional(),
      whatsapp: z.string().trim().max(30).optional(),
      email: z.string().trim().optional(),
      address: z.string().trim().max(240).optional(),
      workingHours: z.string().trim().max(120).optional(),
      mapUrl: z.string().trim().optional(),
    })
    .optional(),
  social: z
    .object({
      facebook: z.string().trim().optional(),
      instagram: z.string().trim().optional(),
      tiktok: z.string().trim().optional(),
      x: z.string().trim().optional(),
      youtube: z.string().trim().optional(),
    })
    .optional(),
  commerce: z
    .object({
      currency: z.string().trim().max(10).optional(),
      currencySymbol: z.string().trim().max(10).optional(),
      minimumOrderAmount: z.coerce.number().min(0).optional(),
      taxEnabled: z.boolean().optional(),
      taxRate: z.coerce.number().min(0).max(100).optional(),
      taxIncludedInPrice: z.boolean().optional(),
      allowCashOnDelivery: z.boolean().optional(),
      allowGuestCheckout: z.boolean().optional(),
      lowStockThreshold: z.coerce.number().min(0).optional(),
    })
    .optional(),
  delivery: z
    .object({ info: z.string().max(400).optional(), preparationNote: z.string().max(400).optional() })
    .optional(),
  announcement: z
    .object({
      enabled: z.boolean().optional(),
      text: z.string().max(240).optional(),
      link: z.string().max(200).optional(),
    })
    .optional(),
  seo: z
    .object({
      metaTitle: z.string().max(120).optional(),
      metaDescription: z.string().max(300).optional(),
      keywords: z.string().max(300).optional(),
    })
    .optional(),
});

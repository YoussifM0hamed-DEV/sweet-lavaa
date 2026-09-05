import { Setting } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { uploadImage, deleteImage } from '../services/cloudinary.service.js';

/** Public storefront configuration consumed by the React app on boot. */
export const getPublicSettings = asyncHandler(async (_req, res) => {
  const settings = await Setting.getSettings();

  return sendSuccess(res, {
    data: {
      settings: {
        store: settings.store,
        contact: settings.contact,
        social: settings.social,
        delivery: settings.delivery,
        announcement: settings.announcement,
        seo: settings.seo,
        commerce: {
          currency: settings.commerce.currency,
          currencySymbol: settings.commerce.currencySymbol,
          minimumOrderAmount: settings.commerce.minimumOrderAmount,
          allowCashOnDelivery: settings.commerce.allowCashOnDelivery,
          taxEnabled: settings.commerce.taxEnabled,
          taxRate: settings.commerce.taxRate,
        },
      },
    },
  });
});

export const getAdminSettings = asyncHandler(async (_req, res) => {
  const settings = await Setting.getSettings();
  return sendSuccess(res, { data: { settings } });
});

/** Deep-merges the submitted sections so partial saves are safe. */
export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await Setting.getSettings();

  Object.entries(req.body).forEach(([section, values]) => {
    if (!values || typeof values !== 'object') return;
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined) settings[section][key] = value;
    });
  });

  settings.updatedBy = req.user._id;
  await settings.save();

  return sendSuccess(res, { message: 'Settings saved.', data: { settings } });
});

export const uploadBranding = asyncHandler(async (req, res) => {
  const field = req.params.field;
  if (!['logo', 'favicon'].includes(field)) throw ApiError.badRequest('Unknown branding asset.');
  if (!req.file) throw ApiError.badRequest('Please choose an image to upload.');

  const settings = await Setting.getSettings();
  const uploaded = await uploadImage(req.file.buffer, { folder: 'branding' });

  if (settings.store[field]?.publicId) await deleteImage(settings.store[field].publicId);
  settings.store[field] = { url: uploaded.url, publicId: uploaded.publicId };
  settings.updatedBy = req.user._id;
  await settings.save();

  return sendSuccess(res, { message: 'Branding updated.', data: { settings } });
});

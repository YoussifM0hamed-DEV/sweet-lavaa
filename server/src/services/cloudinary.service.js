import cloudinary from '../config/cloudinary.js';
import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

const assertConfigured = () => {
  if (!env.cloudinary.enabled) {
    throw ApiError.badRequest('Image uploads are not configured. Add your Cloudinary credentials to the server .env file.');
  }
};

/**
 * Uploads a buffer to Cloudinary and returns the fields we persist on documents.
 * Images are normalised to a sane max size and auto format/quality.
 */
export const uploadImage = (buffer, { folder = 'products', publicId } = {}) => {
  assertConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${env.cloudinary.folder}/${folder}`,
        public_id: publicId,
        resource_type: 'image',
        overwrite: true,
        transformation: [{ width: 1600, height: 1600, crop: 'limit' }, { quality: 'auto:good' }, { fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) return reject(ApiError.internal('The image could not be uploaded. Please try again.'));
        return resolve({ url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height });
      },
    );
    stream.end(buffer);
  });
};

export const uploadImages = (files, options) => Promise.all(files.map((file) => uploadImage(file.buffer, options)));

export const deleteImage = async (publicId) => {
  if (!publicId || !env.cloudinary.enabled) return null;
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    // A failed cleanup should never break the surrounding request.
    logger.warn(`Cloudinary cleanup failed for ${publicId}: ${error.message}`);
    return null;
  }
};

/**
 * Builds a transformed delivery URL (used for thumbnails and cards) without
 * re-uploading anything.
 */
export const buildTransformedUrl = (url, { width = 600, height, crop = 'fill' } = {}) => {
  if (!url || !url.includes('/upload/')) return url;
  const transformation = ['f_auto', 'q_auto', `w_${width}`, height ? `h_${height}` : null, height ? `c_${crop}` : 'c_limit']
    .filter(Boolean)
    .join(',');
  return url.replace('/upload/', `/upload/${transformation}/`);
};

export default { uploadImage, uploadImages, deleteImage, buildTransformedUrl };

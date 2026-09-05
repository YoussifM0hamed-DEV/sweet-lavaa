import multer from 'multer';
import ApiError from '../utils/ApiError.js';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/jpg'];

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    return cb(ApiError.badRequest('Only JPG, PNG, WEBP or AVIF images are accepted.'), false);
  }
  return cb(null, true);
};

const uploader = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
});

export const uploadSingleImage = uploader.single('image');
export const uploadMultipleImages = uploader.array('images', 8);

export default uploader;

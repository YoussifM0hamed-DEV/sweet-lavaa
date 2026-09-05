import { Router } from 'express';
import * as setting from '../controllers/setting.controller.js';
import { protect, requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadSingleImage } from '../middleware/upload.js';
import { PERMISSIONS } from '../config/constants.js';
import { settingsSchema } from '../validators/misc.validator.js';

const router = Router();
const manage = [protect, requirePermission(PERMISSIONS.SETTINGS_MANAGE)];

router.get('/', setting.getPublicSettings);
router.get('/admin', manage, setting.getAdminSettings);
router.patch('/admin', manage, validate({ body: settingsSchema }), setting.updateSettings);
router.post('/admin/branding/:field', manage, uploadSingleImage, setting.uploadBranding);

export default router;

import { Router } from 'express';
import * as category from '../controllers/category.controller.js';
import { protect, requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadSingleImage } from '../middleware/upload.js';
import { PERMISSIONS } from '../config/constants.js';
import { idParams, slugParams } from '../validators/common.js';
import * as schema from '../validators/category.validator.js';

const router = Router();
const manage = [protect, requirePermission(PERMISSIONS.CATEGORY_MANAGE)];

router.get('/', category.listCategories);
router.get('/admin/list', manage, category.adminListCategories);

router.post('/', manage, validate({ body: schema.categoryBodySchema }), category.createCategory);
router.patch('/reorder', manage, validate({ body: schema.reorderCategoriesSchema }), category.reorderCategories);
router.patch('/:id', manage, validate({ params: idParams, body: schema.updateCategorySchema }), category.updateCategory);
router.delete('/:id', manage, validate({ params: idParams }), category.deleteCategory);
router.patch('/:id/status', manage, validate({ params: idParams }), category.toggleCategoryStatus);
router.post('/:id/image', manage, validate({ params: idParams }), uploadSingleImage, category.uploadCategoryImage);

router.get('/:slug', validate({ params: slugParams }), category.getCategoryBySlug);

export default router;

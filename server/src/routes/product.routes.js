import { Router } from 'express';
import * as product from '../controllers/product.controller.js';
import * as adminProduct from '../controllers/adminProduct.controller.js';
import { protect, requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadMultipleImages } from '../middleware/upload.js';
import { PERMISSIONS } from '../config/constants.js';
import { idParams, slugParams } from '../validators/common.js';
import * as schema from '../validators/product.validator.js';

const router = Router();

/* ── Public catalogue ─────────────────────────────────────────────────── */
router.get('/', validate({ query: schema.productQuerySchema }), product.listProducts);
router.get('/search/suggestions', product.searchSuggestions);
router.get('/price-range', product.getPriceRange);
router.get('/recently-viewed', product.getRecentlyViewed);
router.get('/collection/:collection', product.getProductCollection);

/* ── Admin management ─────────────────────────────────────────────────── */
const manage = [protect, requirePermission(PERMISSIONS.PRODUCT_MANAGE)];

router.get('/admin/list', protect, requirePermission(PERMISSIONS.PRODUCT_VIEW), adminProduct.adminListProducts);
router.get('/admin/:id', protect, requirePermission(PERMISSIONS.PRODUCT_VIEW), validate({ params: idParams }), adminProduct.adminGetProduct);

router.post('/', manage, validate({ body: schema.createProductSchema }), adminProduct.createProduct);
router.patch('/:id', manage, validate({ params: idParams, body: schema.updateProductSchema }), adminProduct.updateProduct);
router.delete('/:id', manage, validate({ params: idParams }), adminProduct.deleteProduct);
router.patch('/:id/status', manage, validate({ params: idParams }), adminProduct.toggleProductStatus);
router.patch('/:id/stock', manage, validate({ params: idParams, body: schema.stockUpdateSchema }), adminProduct.updateProductStock);
router.post('/bulk/stock', manage, adminProduct.bulkUpdateStock);

router.post('/:id/images', manage, validate({ params: idParams }), uploadMultipleImages, adminProduct.uploadProductImages);
router.delete('/:id/images/:imageId', manage, adminProduct.deleteProductImage);
router.patch('/:id/images/:imageId/primary', manage, adminProduct.setPrimaryImage);

/* Slug route is last so it cannot shadow the literal paths above. */
router.get('/:slug', validate({ params: slugParams }), product.getProductBySlug);

export default router;

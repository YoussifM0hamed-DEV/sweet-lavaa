import { Router } from 'express';
import * as review from '../controllers/review.controller.js';
import { protect, requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { PERMISSIONS } from '../config/constants.js';
import { idParams } from '../validators/common.js';
import * as schema from '../validators/review.validator.js';

const router = Router();
const moderate = [protect, requirePermission(PERMISSIONS.REVIEW_MODERATE)];

router.get('/product/:productId', review.listProductReviews);

router.get('/my', protect, review.getMyReviews);
router.post('/', protect, writeLimiter, validate({ body: schema.createReviewSchema }), review.createReview);
router.patch('/:id', protect, validate({ params: idParams, body: schema.updateReviewSchema }), review.updateMyReview);
router.delete('/:id', protect, validate({ params: idParams }), review.deleteMyReview);

router.get('/admin/list', moderate, review.adminListReviews);
router.patch('/admin/:id', moderate, validate({ params: idParams, body: schema.moderateReviewSchema }), review.moderateReview);
router.delete('/admin/:id', moderate, validate({ params: idParams }), review.adminDeleteReview);

export default router;

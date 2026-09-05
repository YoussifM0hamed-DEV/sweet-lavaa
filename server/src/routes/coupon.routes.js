import { Router } from 'express';
import * as coupon from '../controllers/coupon.controller.js';
import { protect, requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { PERMISSIONS } from '../config/constants.js';
import { idParams } from '../validators/common.js';
import * as schema from '../validators/coupon.validator.js';

const router = Router();

router.post('/check', protect, validate({ body: schema.applyCouponSchema }), coupon.checkCoupon);

const manage = [protect, requirePermission(PERMISSIONS.COUPON_MANAGE)];

router.get('/admin/list', manage, coupon.adminListCoupons);
router.get('/admin/:id', manage, validate({ params: idParams }), coupon.adminGetCoupon);
router.post('/', manage, validate({ body: schema.couponBodySchema }), coupon.createCoupon);
router.patch('/:id', manage, validate({ params: idParams, body: schema.updateCouponSchema }), coupon.updateCoupon);
router.delete('/:id', manage, validate({ params: idParams }), coupon.deleteCoupon);
router.patch('/:id/status', manage, validate({ params: idParams }), coupon.toggleCouponStatus);

export default router;

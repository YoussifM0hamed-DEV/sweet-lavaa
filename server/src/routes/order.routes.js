import { Router } from 'express';
import * as order from '../controllers/order.controller.js';
import * as adminOrder from '../controllers/adminOrder.controller.js';
import { protect, requirePermission, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { PERMISSIONS, ROLES } from '../config/constants.js';
import { idParams } from '../validators/common.js';
import * as schema from '../validators/order.validator.js';

const router = Router();

router.use(protect);

/* ── Customer ─────────────────────────────────────────────────────────── */
router.post('/', writeLimiter, validate({ body: schema.createOrderSchema }), order.createOrder);
router.get('/my', order.getMyOrders);
router.get('/my/reviewable', order.getReviewableProducts);
router.get('/track/:orderNumber', order.trackOrder);

/* ── Admin (declared before /:id so the literal path wins) ────────────── */
router.get(
  '/admin/list',
  requirePermission(PERMISSIONS.ORDER_VIEW),
  validate({ query: schema.orderQuerySchema }),
  adminOrder.adminListOrders,
);
router.get('/admin/customer/:id', requirePermission(PERMISSIONS.ORDER_VIEW), adminOrder.getCustomerOrders);
router.get('/admin/:id', requirePermission(PERMISSIONS.ORDER_VIEW), validate({ params: idParams }), adminOrder.adminGetOrder);

router.patch(
  '/admin/:id/status',
  requirePermission(PERMISSIONS.ORDER_MANAGE),
  validate({ params: idParams, body: schema.updateOrderStatusSchema }),
  adminOrder.updateOrderStatus,
);
router.patch(
  '/admin/:id/payment',
  requirePermission(PERMISSIONS.ORDER_MANAGE),
  validate({ params: idParams, body: schema.updatePaymentStatusSchema }),
  adminOrder.updatePaymentStatus,
);
router.patch('/admin/:id/note', requirePermission(PERMISSIONS.ORDER_MANAGE), adminOrder.addOrderNote);

/* Destructive and irreversible, so a super admin only — and one order at a time. */
router.delete(
  '/admin/:id',
  restrictTo(ROLES.SUPER_ADMIN),
  validate({ params: idParams }),
  adminOrder.adminDeleteOrder,
);

router.get('/:id', validate({ params: idParams }), order.getMyOrder);
router.patch('/:id/cancel', validate({ params: idParams, body: schema.cancelOrderSchema }), order.cancelMyOrder);

export default router;

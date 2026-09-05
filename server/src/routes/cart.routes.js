import { Router } from 'express';
import * as cart from '../controllers/cart.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as schema from '../validators/cart.validator.js';
import { applyCouponSchema } from '../validators/coupon.validator.js';

const router = Router();

router.use(protect);

router.get('/', cart.getCart);
router.post('/items', validate({ body: schema.addItemSchema }), cart.addItem);
router.patch('/items/:productId', validate({ body: schema.updateItemSchema }), cart.updateItem);
router.delete('/items/:productId', cart.removeItem);
router.delete('/', cart.clearCart);

router.post('/merge', validate({ body: schema.mergeCartSchema }), cart.mergeGuestCart);
router.post('/coupon', validate({ body: applyCouponSchema }), cart.applyCoupon);
router.delete('/coupon', cart.removeCoupon);
router.post('/quote', validate({ body: schema.quoteSchema }), cart.getQuote);

export default router;

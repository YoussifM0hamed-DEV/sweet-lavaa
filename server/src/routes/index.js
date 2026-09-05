import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import productRoutes from './product.routes.js';
import categoryRoutes from './category.routes.js';
import cartRoutes from './cart.routes.js';
import wishlistRoutes from './wishlist.routes.js';
import orderRoutes from './order.routes.js';
import paymentRoutes from './payment.routes.js';
import couponRoutes from './coupon.routes.js';
import deliveryZoneRoutes from './deliveryZone.routes.js';
import reviewRoutes from './review.routes.js';
import settingRoutes from './setting.routes.js';
import adminRoutes from './admin.routes.js';
import miscRoutes from './misc.routes.js';

const router = Router();

router.get('/health', (_req, res) =>
  res.json({ success: true, message: 'Sweet Lava API is running.', timestamp: new Date().toISOString() }),
);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/coupons', couponRoutes);
router.use('/delivery-zones', deliveryZoneRoutes);
router.use('/reviews', reviewRoutes);
router.use('/settings', settingRoutes);
router.use('/admin', adminRoutes);
router.use('/', miscRoutes);

export default router;

import { Router } from 'express';
import * as wishlist from '../controllers/wishlist.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', wishlist.getWishlist);
router.get('/ids', wishlist.getWishlistIds);
router.post('/:productId', wishlist.addToWishlist);
router.delete('/:productId', wishlist.removeFromWishlist);
router.delete('/', wishlist.clearWishlist);

export default router;

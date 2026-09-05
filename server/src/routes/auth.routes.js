import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import * as schema from '../validators/auth.validator.js';

const router = Router();

router.post('/register', authLimiter, validate({ body: schema.registerSchema }), auth.register);
router.post('/login', authLimiter, validate({ body: schema.loginSchema }), auth.login);
router.post('/google', authLimiter, validate({ body: schema.googleSchema }), auth.googleAuth);
router.post('/forgot-password', authLimiter, validate({ body: schema.forgotPasswordSchema }), auth.forgotPassword);
router.post('/reset-password/:token', authLimiter, validate({ body: schema.resetPasswordSchema }), auth.resetPassword);

router.get('/me', protect, auth.getMe);
router.post('/logout', protect, auth.logout);
router.patch('/password', protect, validate({ body: schema.changePasswordSchema }), auth.changePassword);

export default router;

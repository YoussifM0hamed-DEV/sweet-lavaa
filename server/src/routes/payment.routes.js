import { Router } from 'express';
import * as payment from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.js';
import { paymentLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/config', payment.getPaymentConfig);

/* Paymob calls these — they are unauthenticated by design and secured by HMAC. */
router.post('/paymob/webhook', payment.paymobWebhook);
router.get('/paymob/callback', payment.paymobRedirect);

router.post('/paymob/initiate/:orderId', protect, paymentLimiter, payment.initiatePayment);
router.get('/status/:orderId', protect, payment.getPaymentStatus);

export default router;

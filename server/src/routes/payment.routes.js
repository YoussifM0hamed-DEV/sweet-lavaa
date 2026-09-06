import { Router } from 'express';
import * as payment from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.js';
import { paymentLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/config', payment.getPaymentConfig);

/* Fawaterak calls these — unauthenticated by design, secured by the hashKey. */
router.post('/fawaterak/webhook', payment.fawaterakWebhook);
router.get('/fawaterak/callback', payment.fawaterakRedirect);

router.post('/fawaterak/initiate/:orderId', protect, paymentLimiter, payment.initiatePayment);
router.get('/status/:orderId', protect, payment.getPaymentStatus);

export default router;

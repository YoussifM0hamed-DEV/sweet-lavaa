import { Router } from 'express';
import * as misc from '../controllers/misc.controller.js';
import { validate } from '../middleware/validate.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { newsletterSchema, contactSchema } from '../validators/misc.validator.js';

const router = Router();

router.post('/newsletter/subscribe', writeLimiter, validate({ body: newsletterSchema }), misc.subscribeNewsletter);
router.post('/newsletter/unsubscribe', writeLimiter, validate({ body: newsletterSchema }), misc.unsubscribeNewsletter);
router.post('/contact', writeLimiter, validate({ body: contactSchema }), misc.submitContactMessage);

export default router;

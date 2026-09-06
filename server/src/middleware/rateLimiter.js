import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const jsonMessage = (message) => ({ success: false, message });

const base = {
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.nodeEnv === 'test',
};

export const globalLimiter = rateLimit({
  ...base,
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  // Never throttle the platform health check — a 429 there reads as an outage and triggers a restart.
  skip: (req) => env.nodeEnv === 'test' || req.path === '/health',
  message: jsonMessage('Too many requests from this IP. Please try again shortly.'),
});

/** Tight limit on credential endpoints to blunt brute-force attempts. */
export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  message: jsonMessage('Too many sign-in attempts. Please try again in 15 minutes.'),
});

export const paymentLimiter = rateLimit({
  ...base,
  windowMs: 10 * 60 * 1000,
  max: 25,
  message: jsonMessage('Too many payment attempts. Please wait a few minutes.'),
});

export const writeLimiter = rateLimit({
  ...base,
  windowMs: 10 * 60 * 1000,
  max: 60,
  message: jsonMessage('Too many submissions. Please slow down.'),
});

export default { globalLimiter, authLimiter, paymentLimiter, writeLimiter };

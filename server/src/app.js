import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { globalLimiter } from './middleware/rateLimiter.js';

const app = express();

// Behind a proxy (Render/Railway/Nginx) so rate limiting sees real client IPs.
app.set('trust proxy', 1);
app.disable('x-powered-by');

/* ── Security ─────────────────────────────────────────────────────────── */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  }),
);

const allowedOrigins = [
  ...env.allowedOrigins,
  ...(env.isProd ? [] : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173']),
];

/** Vercel preview deployments get a generated subdomain per commit. */
const isVercelPreview = (origin) => /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin);

app.use(
  cors({
    origin(origin, callback) {
      // Same-origin and server-to-server requests carry no Origin header.
      if (!origin) return callback(null, true);
      const clean = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(clean) || isVercelPreview(clean)) return callback(null, true);
      return callback(new Error('This origin is not allowed by CORS.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  }),
);

/* ── Parsing ──────────────────────────────────────────────────────────── */
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser(env.cookieSecret));

// Strips $ and . operators from user input to block NoSQL injection.
app.use(mongoSanitize({ replaceWith: '_' }));
app.use(hpp({ whitelist: ['tags', 'category', 'sort', 'rating'] }));

app.use(compression());

if (!env.isProd) app.use(morgan('dev'));

/* ── Routes ───────────────────────────────────────────────────────────── */
app.use('/api', globalLimiter, routes);

app.get('/', (_req, res) =>
  res.json({ success: true, message: 'Sweet Lava API', docs: '/api/health', version: '1.0.0' }),
);

app.use(notFound);
app.use(errorHandler);

export default app;

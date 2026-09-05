import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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
import ApiError from './utils/ApiError.js';

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
  // When Express also serves the client, the app calls the API from this very origin.
  env.serverUrl.replace(/\/$/, ''),
  ...(env.isProd ? [] : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173']),
].filter(Boolean);

/** Vercel preview deployments get a generated subdomain per commit. */
const isVercelPreview = (origin) => /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin);

const corsMiddleware = cors({
  origin(origin, callback) {
    // Same-origin and server-to-server requests carry no Origin header.
    if (!origin) return callback(null, true);
    const clean = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(clean) || isVercelPreview(clean)) return callback(null, true);
    return callback(ApiError.forbidden('This origin is not allowed to call the API.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
});

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
app.use('/api', corsMiddleware, globalLimiter, routes);

/**
 * Single-service deployment: when the client has been built, Express serves it.
 * The API and the storefront then share one origin, which removes CORS from the
 * picture entirely. When there is no build (local development, where Vite serves
 * the client) the root route falls back to a plain API banner.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, '../../client/dist');
const hasClientBuild = fs.existsSync(path.join(clientDist, 'index.html'));

if (hasClientBuild) {
  // Hashed asset filenames are safe to cache forever.
  app.use(express.static(clientDist, { index: false, maxAge: '1y', etag: true }));

  // Anything that is not an API call is handed to the React router.
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    // index.html must never be cached, or clients pin to an old asset manifest.
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (_req, res) =>
    res.json({ success: true, message: 'Sweet Lava API', docs: '/api/health', version: '1.0.0' }),
  );
}

app.use(notFound);
app.use(errorHandler);

export default app;

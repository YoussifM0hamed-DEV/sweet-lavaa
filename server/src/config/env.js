import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const required = ['MONGODB_URI', 'JWT_SECRET'];

const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`\n[config] Missing required environment variables: ${missing.join(', ')}`);
  console.error('[config] Copy server/.env.example to server/.env and fill in the values.\n');
  process.exit(1);
}

const num = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: num(process.env.PORT, 5000),
  clientUrl: (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim(),
  /**
   * CLIENT_URL accepts a comma-separated list so a deployment can allow its
   * production domain and any preview domains at once. The first entry is the
   * canonical one used when building links.
   */
  allowedOrigins: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean),
  serverUrl: process.env.SERVER_URL || 'http://localhost:5000',

  mongoUri: process.env.MONGODB_URI,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  cookieSecret: process.env.COOKIE_SECRET || process.env.JWT_SECRET,

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    get enabled() {
      return Boolean(process.env.GOOGLE_CLIENT_ID);
    },
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'sweet-lava',
    get enabled() {
      return Boolean(
        process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET,
      );
    },
  },


  mail: {
    // Gmail works with an App Password (not the account password) once
    // 2-Step Verification is on. Any other SMTP provider works the same way.
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: num(process.env.SMTP_PORT, 465),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || '',
    // Where "a new order came in" goes. Falls back to the sending account.
    notify: process.env.MAIL_NOTIFY || process.env.SMTP_USER || '',
    get enabled() {
      return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
    },
  },

  rateLimit: {
    windowMs: num(process.env.RATE_LIMIT_WINDOW_MINUTES, 15) * 60 * 1000,
    max: num(process.env.RATE_LIMIT_MAX, 1000),
  },

  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@sweetlava.com',
    adminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
  },
};

export default env;

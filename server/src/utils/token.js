import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';

export const signAccessToken = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role, tokenVersion: user.tokenVersion ?? 0 }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

export const signRefreshToken = (user) =>
  jwt.sign({ sub: String(user._id), tokenVersion: user.tokenVersion ?? 0 }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  });

export const verifyAccessToken = (token) => jwt.verify(token, env.jwtSecret);
export const verifyRefreshToken = (token) => jwt.verify(token, env.jwtRefreshSecret);

export const createRandomToken = () => {
  const raw = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hashed };
};

export const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

const COOKIE_NAME = 'sl_token';

export const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

export const clearAuthCookie = (res) => {
  res.clearCookie(COOKIE_NAME, { path: '/', httpOnly: true, secure: env.isProd, sameSite: env.isProd ? 'none' : 'lax' });
};

export const AUTH_COOKIE_NAME = COOKIE_NAME;

import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';

const client = env.google.enabled ? new OAuth2Client(env.google.clientId, env.google.clientSecret) : null;

/**
 * Verifies a Google ID token issued for our client id and returns the profile.
 * The signature check is what makes this safe — we never trust profile data
 * posted directly by the browser.
 */
export const verifyGoogleIdToken = async (credential) => {
  if (!client) {
    throw ApiError.badRequest('Google sign-in is not configured on this server.');
  }
  if (!credential) throw ApiError.badRequest('Missing Google credential.');

  let ticket;
  try {
    ticket = await client.verifyIdToken({ idToken: credential, audience: env.google.clientId });
  } catch {
    throw ApiError.unauthorized('We could not verify your Google account. Please try again.');
  }

  const payload = ticket.getPayload();
  if (!payload?.email) throw ApiError.unauthorized('Your Google account did not share an email address.');
  if (payload.email_verified === false) throw ApiError.unauthorized('Your Google email address is not verified.');

  const [firstName, ...rest] = (payload.given_name ? [payload.given_name, payload.family_name] : String(payload.name || 'Sweet Friend').split(' ')).filter(Boolean);

  return {
    googleId: payload.sub,
    email: String(payload.email).toLowerCase(),
    firstName: firstName || 'Sweet',
    lastName: rest.join(' ') || 'Friend',
    avatar: payload.picture || '',
    isEmailVerified: Boolean(payload.email_verified),
  };
};

export default { verifyGoogleIdToken };

import jwt from 'jsonwebtoken';
import { env } from './env.js';

// Keys are stored base64-encoded in env vars so multi-line PEM content
// survives .env files / hosting-provider env var UIs without escaping issues.
const privateKey = Buffer.from(env.JWT_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
const publicKey = Buffer.from(env.JWT_PUBLIC_KEY_BASE64, 'base64').toString('utf8');

/**
 * AUTH-CL-002/003: Access token — short-lived, carries role claims.
 */
export function signAccessToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    privateKey,
    { algorithm: 'RS256', expiresIn: env.JWT_ACCESS_EXPIRES_IN }
  );
}

/**
 * AUTH-CL-002: Refresh token — long-lived, minimal claims (just userId +
 * a random jti so we can tie it to a specific refresh_tokens row for revocation).
 */
export function signRefreshToken(user, jti) {
  return jwt.sign(
    { userId: user.id, jti },
    privateKey,
    { algorithm: 'RS256', expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, publicKey, { algorithms: ['RS256'] });
}

export function decodeTokenUnsafe(token) {
  return jwt.decode(token);
}

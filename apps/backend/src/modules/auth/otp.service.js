import crypto from 'node:crypto';
import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';

// In-memory store for the MVP — swap for Redis (`config/redis.js`) once that's
// wired up, so OTPs survive across server instances/restarts in production.
const otpStore = new Map(); // userId -> { code, expiresAt }

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function generateOtp(userId) {
  const code = String(crypto.randomInt(100000, 999999));
  otpStore.set(userId, { code, expiresAt: Date.now() + OTP_TTL_MS });
  return code;
}

export function verifyOtp(userId, code) {
  const entry = otpStore.get(userId);
  if (!entry) return { valid: false, reason: 'No OTP requested for this user' };
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(userId);
    return { valid: false, reason: 'OTP has expired' };
  }
  if (entry.code !== code) return { valid: false, reason: 'Incorrect OTP' };
  otpStore.delete(userId);
  return { valid: true };
}

/**
 * Sends the OTP via SMS gateway. Stubbed with a log line until a gateway
 * (e.g. MSG91, Twilio) is wired in — the interface is what matters for
 * everything upstream (auth.service.js) to build against.
 */
export async function sendOtpSms(phone, code) {
  if (!env.SMS_GATEWAY_API_KEY) {
    logger.warn('SMS gateway not configured — logging OTP instead of sending', { phone, code });
    return;
  }
  // TODO: integrate real SMS gateway call here.
  logger.info('OTP dispatched', { phone });
}

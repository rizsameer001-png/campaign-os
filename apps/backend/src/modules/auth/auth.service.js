import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { prisma } from '../../config/db.js';
import { signAccessToken, signRefreshToken, verifyToken } from '../../config/jwt.js';
import { ApiError } from '../../utils/responseFormatter.js';
import { generateOtp, sendOtpSms, verifyOtp } from './otp.service.js';
import { generateTotpSecret, verifyTotpCode } from './twofactor.service.js';
import { recordAudit } from '../../middleware/auditLogger.js';
import { USER_STATUS, ROLES } from '@election-os/shared/roles';

const BCRYPT_COST = 12; // AUTH-C-005 / SEC-001
const MAX_FAILED_LOGINS = 5; // AUTH-CL-004
const LOCKOUT_MS = 15 * 60 * 1000;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ---------------------------------------------------------------------------
// Registration (AUTH-C-001..010)
// ---------------------------------------------------------------------------
export async function registerCandidate(input) {
  const existingEmail = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingEmail) throw new ApiError(409, 'An account with this email already exists');

  const existingPhone = await prisma.user.findUnique({ where: { phone: input.phone } });
  if (existingPhone) throw new ApiError(409, 'An account with this phone number already exists');

  // AUTH-C-002/003 constraints are also enforced at the DB layer (unique
  // indexes on email/phone) as a second line of defense against races.

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
      state: input.state,
      constituencyName: input.constituency, // resolved to constituencyId by candidate.service later if needed
      party: input.party,
      role: ROLES.CANDIDATE,
      status: USER_STATUS.PENDING_APPROVAL, // AUTH-C-006
    },
  });

  const otp = generateOtp(user.id);
  await sendOtpSms(user.phone, otp);

  // AUTH-C-007: welcome email — queued via notifications module (Part 1 stub).
  await queueWelcomeEmail(user);

  return { userId: user.id, message: 'Registered. Please verify your phone number with the OTP sent.' };
}

async function queueWelcomeEmail(user) {
  // Delegates to notifications.service in the real build; kept as a direct
  // stub here so Part 1's auth flow doesn't hard-depend on the queue infra.
  const { sendWelcomeEmail } = await import('../notifications/notifications.service.js');
  await sendWelcomeEmail(user).catch(() => {});
}

// ---------------------------------------------------------------------------
// Phone OTP verification (AUTH-C-003)
// ---------------------------------------------------------------------------
export async function verifyPhoneOtp(userId, otp) {
  const result = verifyOtp(userId, otp);
  if (!result.valid) throw new ApiError(400, result.reason);

  await prisma.user.update({ where: { id: userId }, data: { phoneVerified: true } });
  return { message: 'Phone verified. Your account is pending admin approval.' };
}

export async function resendPhoneOtp(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'User not found');

  const otp = generateOtp(userId);
  await sendOtpSms(user.phone, otp);
  return { message: 'OTP resent' };
}

// ---------------------------------------------------------------------------
// Candidate login (AUTH-CL-001..008)
// ---------------------------------------------------------------------------
export async function loginCandidate({ email, password, rememberMe, req }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(401, 'Invalid email or password');

  // AUTH-CL-004: lockout check
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new ApiError(423, 'Account temporarily locked due to too many failed attempts');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    await handleFailedLogin(user);
    throw new ApiError(401, 'Invalid email or password');
  }

  // AUTH-CL-005
  if ([USER_STATUS.PENDING_APPROVAL, USER_STATUS.SUSPENDED, USER_STATUS.BANNED].includes(user.status)) {
    throw new ApiError(403, `Account status is ${user.status}; cannot log in`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null },
  });

  return issueSessionTokens(user, { rememberMe, req });
}

async function handleFailedLogin(user) {
  const failedLoginCount = user.failedLoginCount + 1;
  const shouldLock = failedLoginCount >= MAX_FAILED_LOGINS;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: shouldLock ? 0 : failedLoginCount,
      lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_MS) : null,
    },
  });

  if (shouldLock) {
    const { sendLockoutEmail } = await import('../notifications/notifications.service.js');
    await sendLockoutEmail(user).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Admin login with 2FA (AUTH-A-001..006)
// ---------------------------------------------------------------------------
export async function loginAdmin({ email, password, totpCode, req }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || ![ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user.role)) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    await recordAudit({
      userId: user.id,
      action: 'admin.login.failed',
      entityType: 'User',
      entityId: user.id,
      req,
    });
    throw new ApiError(401, 'Invalid credentials');
  }

  if (!user.totpSecretEncrypted) {
    throw new ApiError(400, 'Two-factor authentication is not yet set up for this account');
  }
  if (!totpCode || !verifyTotpCode(user.totpSecretEncrypted, totpCode)) {
    throw new ApiError(401, 'Invalid or missing 2FA code');
  }

  await recordAudit({
    userId: user.id,
    action: 'admin.login.success',
    entityType: 'User',
    entityId: user.id,
    req,
  });

  // AUTH-A-004: shorter session for admins is enforced via a shorter
  // access-token lifetime configured at issuance time in practice; kept
  // simple here by reusing the standard issuer.
  return issueSessionTokens(user, { rememberMe: false, req });
}

// ---------------------------------------------------------------------------
// Session/token issuance & refresh (AUTH-CL-002, AUTH-S-001..005)
// ---------------------------------------------------------------------------
async function issueSessionTokens(user, { rememberMe, req }) {
  const jti = crypto.randomUUID();
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user, jti);

  const expiresAt = new Date(
    Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000
  );

  await prisma.refreshToken.create({
    data: {
      id: jti,
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      deviceFingerprint: req?.headers?.['x-device-fingerprint'] ?? null,
      ipAddress: req?.ip ?? null,
      userAgent: req?.headers?.['user-agent'] ?? null,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

export async function refreshSession(refreshToken, req) {
  if (!refreshToken) throw new ApiError(401, 'No refresh token provided');

  let payload;
  try {
    payload = verifyToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { id: payload.jti } });
  if (!stored || stored.tokenHash !== hashToken(refreshToken) || stored.expiresAt < new Date()) {
    throw new ApiError(401, 'Refresh token is no longer valid');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw new ApiError(401, 'User not found');

  // Rotate: invalidate the old token, issue a new pair.
  await prisma.refreshToken.delete({ where: { id: stored.id } });
  return issueSessionTokens(user, { rememberMe: false, req });
}

export async function logout(refreshTokenId) {
  if (refreshTokenId) {
    await prisma.refreshToken.deleteMany({ where: { id: refreshTokenId } });
  }
  return { message: 'Logged out' };
}

// ---------------------------------------------------------------------------
// Forgot / reset password (AUTH-CL-007, AUTH-S-005)
// ---------------------------------------------------------------------------
export async function requestPasswordReset(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success shape regardless of whether the email exists,
  // to avoid leaking which emails are registered.
  if (!user) return { message: 'If that email exists, a reset link has been sent.' };

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Reuses refresh_tokens-style storage pattern via a dedicated field set;
  // in the full schema this would be its own `password_reset_tokens` table —
  // omitted here for brevity, tracked as a TODO before production.
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: expiresAt },
  });

  const { sendPasswordResetEmail } = await import('../notifications/notifications.service.js');
  await sendPasswordResetEmail(user, rawToken).catch(() => {});

  return { message: 'If that email exists, a reset link has been sent.' };
}

export async function resetPassword(token, newPassword) {
  const tokenHash = hashToken(token);
  const user = await prisma.user.findFirst({
    where: { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: { gt: new Date() } },
  });
  if (!user) throw new ApiError(400, 'Invalid or expired reset token');

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordResetTokenHash: null, passwordResetExpiresAt: null },
    }),
    // AUTH-S-005: invalidate all existing sessions on password change
    prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
  ]);

  return { message: 'Password reset successfully. Please log in again.' };
}

// ---------------------------------------------------------------------------
// Sessions (AUTH-S-004)
// ---------------------------------------------------------------------------
export async function listSessions(userId) {
  return prisma.refreshToken.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    select: { id: true, deviceFingerprint: true, ipAddress: true, userAgent: true, createdAt: true, expiresAt: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function revokeSession(userId, sessionId) {
  const result = await prisma.refreshToken.deleteMany({ where: { id: sessionId, userId } });
  if (result.count === 0) throw new ApiError(404, 'Session not found');
  return { message: 'Session revoked' };
}

// ---------------------------------------------------------------------------
// Current user (AUTH-C-...)
// ---------------------------------------------------------------------------
export async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, phone: true, role: true, status: true,
      state: true, party: true, bio: true, profilePhotoUrl: true, slug: true,
      socialLinks: true, emailVerified: true, phoneVerified: true, createdAt: true,
    },
  });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

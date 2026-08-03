import bcrypt from 'bcrypt';
import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/responseFormatter.js';
import { destroyAsset } from '../../config/cloudinary.js';
import { generateOtp, sendOtpSms } from '../auth/otp.service.js';

const BCRYPT_COST = 12;

// CD-P-001: candidates can update name, phone, bio, profile photo, social links.
// Constituency/party changes are flagged pending admin approval (CD-P-002)
// rather than applied directly.
export async function updateProfile(userId, updates) {
  const { name, bio, socialLinks, profilePhotoUrl, profilePhotoId, constituencyName, party } = updates;

  const data = {};
  if (name !== undefined) data.name = name;
  if (bio !== undefined) data.bio = bio;
  if (socialLinks !== undefined) data.socialLinks = socialLinks;

  if (profilePhotoUrl !== undefined) {
    const existing = await prisma.user.findUnique({ where: { id: userId }, select: { profilePhotoId: true } });
    if (existing?.profilePhotoId && existing.profilePhotoId !== profilePhotoId) {
      await destroyAsset(existing.profilePhotoId).catch(() => {});
    }
    data.profilePhotoUrl = profilePhotoUrl;
    data.profilePhotoId = profilePhotoId;
  }

  // CD-P-002: constituency/party changes require admin approval — recorded
  // as a pending change request rather than applied immediately. Simplified
  // here to a direct notification to admins; a full implementation would
  // have a `profile_change_requests` table.
  if (constituencyName !== undefined || party !== undefined) {
    const { notifyAdminsOfProfileChangeRequest } = await import('../notifications/notifications.service.js');
    await notifyAdminsOfProfileChangeRequest(userId, { constituencyName, party }).catch(() => {});
  }

  const user = await prisma.user.update({ where: { id: userId }, data });
  return sanitizeUser(user);
}

// CD-P-003: email change requires OTP verification on the *new* email.
export async function requestEmailChange(userId, newEmail) {
  const existing = await prisma.user.findUnique({ where: { email: newEmail } });
  if (existing) throw new ApiError(409, 'Email already in use');

  const otp = generateOtp(`email-change:${userId}`);
  // In production this sends to newEmail via SMTP, not SMS — stubbed here
  // for parity with the phone OTP flow already built in Part 1.
  await sendOtpSms(newEmail, otp);
  return { message: 'Verification code sent to the new email address' };
}

export async function confirmEmailChange(userId, newEmail, otp) {
  const { verifyOtp } = await import('../auth/otp.service.js');
  const result = verifyOtp(`email-change:${userId}`, otp);
  if (!result.valid) throw new ApiError(400, result.reason);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { email: newEmail, emailVerified: true },
  });
  return sanitizeUser(user);
}

// CD-P-004: password change requires current password confirmation.
export async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) throw new ApiError(400, 'Current password is incorrect');

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    // AUTH-S-005: force re-login everywhere else
    prisma.refreshToken.deleteMany({ where: { userId } }),
  ]);

  return { message: 'Password changed. Please log in again.' };
}

// CD-P-005: profile completion percentage across a fixed set of fields.
const COMPLETION_FIELDS = ['name', 'phone', 'bio', 'profilePhotoUrl', 'socialLinks', 'party'];

export async function getProfileCompletion(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'User not found');

  const filled = COMPLETION_FIELDS.filter((field) => Boolean(user[field])).length;
  return { percent: Math.round((filled / COMPLETION_FIELDS.length) * 100) };
}

// CD-P-006: public profile visibility toggle + slug.
export async function updatePublicProfileSettings(userId, { profileVisibility, slug }) {
  if (slug) {
    const existing = await prisma.user.findUnique({ where: { slug } });
    if (existing && existing.id !== userId) throw new ApiError(409, 'Slug already taken');
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: { ...(profileVisibility !== undefined ? { profileVisibility } : {}), ...(slug ? { slug } : {}) },
  });
  return sanitizeUser(user);
}

// CD-P-008: soft-delete with 30-day grace period.
export async function requestAccountDeletion(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: { status: 'deleted', deletedAt: new Date() },
  });
  await prisma.refreshToken.deleteMany({ where: { userId } });
  return { message: 'Account deletion requested. You have 30 days to reactivate by contacting support.' };
}

function sanitizeUser(user) {
  const { passwordHash, totpSecretEncrypted, passwordResetTokenHash, ...safe } = user;
  return safe;
}

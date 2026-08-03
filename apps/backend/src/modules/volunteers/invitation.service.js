import crypto from 'node:crypto';
import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/responseFormatter.js';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // VMS-O-002: 7 days
const inviteStore = new Map(); // token -> { candidateId, email, expiresAt, used }

// VMS-O-001/002: single-use, 7-day token. In-memory for now (mirrors the
// OTP store pattern from Part 1) — promote to a DB table if invitations
// need to survive a server restart before being accepted.
export function createInvitation(candidateId, email) {
  const token = crypto.randomBytes(24).toString('hex');
  inviteStore.set(token, { candidateId, email, expiresAt: Date.now() + INVITE_TTL_MS, used: false });
  return token;
}

export function validateInvitation(token) {
  const invite = inviteStore.get(token);
  if (!invite) throw new ApiError(400, 'Invitation link is invalid');
  if (invite.used) throw new ApiError(400, 'Invitation link has already been used');
  if (Date.now() > invite.expiresAt) throw new ApiError(400, 'Invitation link has expired');
  return invite;
}

export function consumeInvitation(token) {
  const invite = validateInvitation(token);
  invite.used = true;
  return invite;
}

// VMS-O-008: max volunteers per candidate (admin-configurable via system_settings)
export async function checkVolunteerCap(candidateId) {
  const setting = await prisma.systemSetting.findUnique({ where: { key: 'max_volunteers_per_candidate' } });
  const cap = setting?.value ?? 500;

  const count = await prisma.volunteer.count({ where: { candidateId } });
  if (count >= cap) {
    throw new ApiError(409, `Volunteer limit reached (${cap}). Contact an administrator to raise it.`);
  }
}

import bcrypt from 'bcrypt';
import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/responseFormatter.js';
import { createInvitation, consumeInvitation, checkVolunteerCap } from './invitation.service.js';
import { ROLES } from '@election-os/shared/roles';

const BCRYPT_COST = 12;

// VMS-O-001: candidate invites a volunteer by email
export async function inviteVolunteer(candidateId, email) {
  await checkVolunteerCap(candidateId);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, 'A user with this email already exists');

  const token = createInvitation(candidateId, email);

  const candidate = await prisma.user.findUnique({ where: { id: candidateId }, select: { name: true } });
  const { sendVolunteerInviteEmail } = await import('../notifications/notifications.service.js');
  await sendVolunteerInviteEmail(email, candidate.name, token).catch(() => {});

  return { message: 'Invitation sent', token }; // token also returned for local/dev testing without SMTP
}

// VMS-O-003/004/005: volunteer completes signup via the invite token
export async function completeVolunteerSignup(token, { name, phone, password, address, assignedBooth }) {
  const invite = consumeInvitation(token);

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  const user = await prisma.user.create({
    data: {
      name,
      email: invite.email,
      phone,
      passwordHash,
      role: ROLES.VOLUNTEER,
      status: 'active', // volunteers don't go through candidate-approval pending state
      emailVerified: true,
    },
  });

  const volunteer = await prisma.volunteer.create({
    data: {
      userId: user.id,
      candidateId: invite.candidateId,
      name,
      phone,
      email: invite.email,
      address,
      assignedBooth,
      status: 'pending', // VMS-O-006: candidate still approves/rejects the application
    },
  });

  return { user, volunteer };
}

// VMS-O-006
export async function reviewVolunteerApplication(candidateId, volunteerId, decision) {
  const volunteer = await prisma.volunteer.findFirst({ where: { id: volunteerId, candidateId } });
  if (!volunteer) throw new ApiError(404, 'Volunteer not found');

  const updated = await prisma.volunteer.update({
    where: { id: volunteerId },
    data: { status: decision === 'approve' ? 'approved' : 'rejected' },
  });

  const { sendVolunteerDecisionNotification } = await import('../notifications/notifications.service.js');
  await sendVolunteerDecisionNotification(volunteer.userId, decision).catch(() => {});

  return updated;
}

export async function listVolunteers(candidateId, { status, page = 1, limit = 25 } = {}) {
  const where = { candidateId, ...(status ? { status } : {}) };
  const [items, total] = await Promise.all([
    prisma.volunteer.findMany({ where, orderBy: { joinedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.volunteer.count({ where }),
  ]);
  return { items, total, page, limit };
}

export async function getVolunteer(candidateId, volunteerId) {
  const volunteer = await prisma.volunteer.findFirst({ where: { id: volunteerId, candidateId } });
  if (!volunteer) throw new ApiError(404, 'Volunteer not found');
  return volunteer;
}

export async function updateVolunteer(candidateId, volunteerId, data) {
  const volunteer = await prisma.volunteer.findFirst({ where: { id: volunteerId, candidateId } });
  if (!volunteer) throw new ApiError(404, 'Volunteer not found');
  return prisma.volunteer.update({ where: { id: volunteerId }, data });
}

export async function removeVolunteer(candidateId, volunteerId) {
  const volunteer = await prisma.volunteer.findFirst({ where: { id: volunteerId, candidateId } });
  if (!volunteer) throw new ApiError(404, 'Volunteer not found');
  await prisma.volunteer.update({ where: { id: volunteerId }, data: { status: 'inactive' } });
  return { message: 'Volunteer removed' };
}

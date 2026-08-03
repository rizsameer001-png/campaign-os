import { prisma } from '../../config/db.js';
import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';

/**
 * Part 1 scope: enough of the notifications module to support the auth and
 * profile flows (welcome email, lockout alert, password reset, admin
 * change-request pings). Full NCS-001..008 (SMS, push, templates, queue)
 * lands in Part 3 alongside the rest of the operational modules.
 */

async function sendEmail({ to, subject, body }) {
  if (!env.SMTP_HOST) {
    logger.warn('SMTP not configured — logging email instead of sending', { to, subject });
    return;
  }
  // TODO: wire real SMTP client (nodemailer) here in Part 3's notifications module.
  logger.info('Email dispatched', { to, subject });
}

async function createInAppNotification(userId, { type, title, message, metadata }) {
  return prisma.notification.create({
    data: { userId, type, title, message, metadata: metadata ?? undefined },
  });
}

// AUTH-C-007
export async function sendWelcomeEmail(user) {
  await sendEmail({
    to: user.email,
    subject: 'Welcome to the Election Campaign OS',
    body: `Hi ${user.name}, thanks for registering. Verify your phone to continue.`,
  });
}

// AUTH-C-007 (approval side, called from Part 3's admin approval flow)
export async function sendApprovalEmail(user) {
  await sendEmail({
    to: user.email,
    subject: 'Your account has been approved',
    body: `Hi ${user.name}, your candidate account is now active.`,
  });
  await createInAppNotification(user.id, {
    type: 'success',
    title: 'Account approved',
    message: 'Your account has been approved by an administrator.',
  });
}

// AUTH-CL-004
export async function sendLockoutEmail(user) {
  await sendEmail({
    to: user.email,
    subject: 'Your account was temporarily locked',
    body: `Hi ${user.name}, we detected 5 failed login attempts and locked your account for 15 minutes.`,
  });
}

// AUTH-CL-007
export async function sendPasswordResetEmail(user, rawToken) {
  const resetUrl = `${env.ALLOWED_ORIGINS.split(',')[0]}/reset-password?token=${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Reset your password',
    body: `Reset your password here: ${resetUrl} (expires in 1 hour)`,
  });
}

// NCS-006: check per-user email/SMS preference before sending; defaults to
// both enabled if the user hasn't set preferences.
async function getPreferences(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { notificationPreferences: true } });
  return { email: true, sms: true, ...(user?.notificationPreferences ?? {}) };
}

// VMS-O-001
export async function sendVolunteerInviteEmail(email, candidateName, token) {
  const inviteUrl = `${env.ALLOWED_ORIGINS.split(',')[0]}/volunteer-signup?token=${token}`;
  await sendEmail({
    to: email,
    subject: `${candidateName} invited you to join their campaign`,
    body: `You've been invited to volunteer for ${candidateName}'s campaign. Sign up here: ${inviteUrl} (link expires in 7 days).`,
  });
}

// VMS-O-006
export async function sendVolunteerDecisionNotification(volunteerUserId, decision) {
  const prefs = await getPreferences(volunteerUserId);
  await createInAppNotification(volunteerUserId, {
    type: decision === 'approve' ? 'success' : 'warning',
    title: decision === 'approve' ? 'Application approved' : 'Application not approved',
    message: decision === 'approve'
      ? 'Your volunteer application has been approved. Welcome aboard!'
      : 'Your volunteer application was not approved this time.',
  });
  if (prefs.email) {
    const user = await prisma.user.findUnique({ where: { id: volunteerUserId } });
    await sendEmail({
      to: user.email,
      subject: decision === 'approve' ? 'Your application was approved' : 'Application update',
      body: decision === 'approve' ? 'Welcome to the team!' : 'Thanks for applying — not approved this time.',
    });
  }
}

// VMS-T-005: overdue task alert to the candidate
export async function sendOverdueTaskAlert(candidateId, task) {
  await createInAppNotification(candidateId, {
    type: 'warning',
    title: 'Task overdue',
    message: `"${task.title}" is overdue.`,
    metadata: { taskId: task.id },
  });
}

// LCC-M-007: sentiment/coverage threshold alert
export async function sendCampaignAlert(candidateId, { title, message, metadata }) {
  await createInAppNotification(candidateId, { type: 'warning', title, message, metadata });
}

// SPI-S-004: service inquiry auto-reply + admin ping
export async function sendServiceInquiryAutoReply(email) {
  await sendEmail({
    to: email,
    subject: "We've received your inquiry",
    body: 'Thanks for reaching out — our team will get back to you shortly.',
  });
}

export async function notifyAdminsOfNewLead(lead) {
  const admins = await prisma.user.findMany({ where: { role: { in: ['admin', 'super_admin'] } }, select: { id: true } });
  await Promise.all(
    admins.map((admin) =>
      createInAppNotification(admin.id, {
        type: 'info',
        title: 'New lead',
        message: `${lead.name} submitted an inquiry via ${lead.source}.`,
        metadata: { leadId: lead.id },
      })
    )
  );
}

// CD-P-002
export async function notifyAdminsOfProfileChangeRequest(userId, changes) {
  const admins = await prisma.user.findMany({
    where: { role: { in: ['admin', 'super_admin'] } },
    select: { id: true },
  });
  await Promise.all(
    admins.map((admin) =>
      createInAppNotification(admin.id, {
        type: 'info',
        title: 'Profile change request',
        message: `A candidate requested a constituency/party change.`,
        metadata: { userId, changes },
      })
    )
  );
}

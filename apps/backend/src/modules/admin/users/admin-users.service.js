import { prisma } from '../../../config/db.js';
import { ApiError } from '../../../utils/responseFormatter.js';
import { recordAudit } from '../../../middleware/auditLogger.js';
import { signAccessToken } from '../../../config/jwt.js';

// AD-U-001/002/003/004
export async function listUsers({ role, status, state, search, page = 1, limit = 25, sortBy = 'createdAt', sortOrder = 'desc' }) {
  const where = {
    deletedAt: null,
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(state ? { state } : {}),
    ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, name: true, email: true, role: true, status: true, state: true, constituencyName: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total, page, limit };
}

// AD-U-006
export async function getUserDetail(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, phone: true, role: true, status: true, state: true,
      constituencyName: true, party: true, createdAt: true, emailVerified: true, phoneVerified: true,
    },
  });
  if (!user) throw new ApiError(404, 'User not found');

  const [readinessReportCount, campaignPlanCount, aiUsage, loginHistory] = await Promise.all([
    prisma.readinessReport.count({ where: { userId } }),
    prisma.campaignPlan.count({ where: { userId } }),
    prisma.aiUsageLog.aggregate({ where: { userId }, _sum: { costInr: true }, _count: true }),
    prisma.refreshToken.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 10, select: { ipAddress: true, userAgent: true, createdAt: true } }),
  ]);

  return {
    ...user,
    stats: { readinessReportCount, campaignPlanCount, aiRequestCount: aiUsage._count, aiTotalCostInr: aiUsage._sum.costInr ?? 0 },
    recentLogins: loginHistory,
  };
}

// AD-U-007
export async function approveCandidate(userId, adminId, req) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'User not found');
  if (user.status !== 'pending_approval') throw new ApiError(400, `User status is ${user.status}, not pending_approval`);

  const updated = await prisma.user.update({ where: { id: userId }, data: { status: 'active' } });

  await recordAudit({ userId: adminId, action: 'user.approve', entityType: 'User', entityId: userId, oldValues: { status: 'pending_approval' }, newValues: { status: 'active' }, req });

  const { sendApprovalEmail } = await import('../../notifications/notifications.service.js');
  await sendApprovalEmail(updated).catch(() => {});

  return updated;
}

// AD-U-008
export async function suspendUser(userId, adminId, reason, req) {
  const updated = await prisma.user.update({ where: { id: userId }, data: { status: 'suspended' } });
  await prisma.refreshToken.deleteMany({ where: { userId } }); // force logout everywhere
  await recordAudit({ userId: adminId, action: 'user.suspend', entityType: 'User', entityId: userId, newValues: { status: 'suspended', reason }, req });
  return updated;
}

// AD-U-009
export async function banUser(userId, adminId, reason, req) {
  const updated = await prisma.user.update({ where: { id: userId }, data: { status: 'banned' } });
  await prisma.refreshToken.deleteMany({ where: { userId } });
  await recordAudit({ userId: adminId, action: 'user.ban', entityType: 'User', entityId: userId, newValues: { status: 'banned', reason }, req });
  return updated;
}

// AD-U-010: soft delete, 90-day retention before purge (purge job not built —
// noted as a scheduled job to add, same pattern as jobs/cloudinary-cleanup)
export async function softDeleteUser(userId, adminId, req) {
  const updated = await prisma.user.update({ where: { id: userId }, data: { status: 'deleted', deletedAt: new Date() } });
  await prisma.refreshToken.deleteMany({ where: { userId } });
  await recordAudit({ userId: adminId, action: 'user.delete', entityType: 'User', entityId: userId, req });
  return updated;
}

// AD-U-005: bulk actions
export async function bulkAction(userIds, action, adminId, req) {
  const results = [];
  for (const userId of userIds) {
    try {
      if (action === 'approve') results.push(await approveCandidate(userId, adminId, req));
      else if (action === 'suspend') results.push(await suspendUser(userId, adminId, 'bulk action', req));
      else if (action === 'ban') results.push(await banUser(userId, adminId, 'bulk action', req));
      else if (action === 'delete') results.push(await softDeleteUser(userId, adminId, req));
    } catch (err) {
      results.push({ userId, error: err.message });
    }
  }
  return results;
}

// AD-U-011: super_admin only, enforced at the route layer via authorize()
export async function createAdmin({ name, email, phone, passwordHash }, creatorId, req) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, 'A user with this email already exists');

  const admin = await prisma.user.create({
    data: { name, email, phone, passwordHash, role: 'admin', status: 'active', emailVerified: true, phoneVerified: true },
  });

  await recordAudit({ userId: creatorId, action: 'admin.create', entityType: 'User', entityId: admin.id, req });
  return admin;
}

// AD-U-012/AUTH-R-009: impersonation — issues a short-lived token for the
// target user, fully audited.
export async function impersonateUser(targetUserId, adminId, req) {
  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) throw new ApiError(404, 'User not found');

  await recordAudit({ userId: adminId, action: 'user.impersonate', entityType: 'User', entityId: targetUserId, req });

  const accessToken = signAccessToken(target);
  return { accessToken, impersonating: { id: target.id, name: target.name, role: target.role } };
}

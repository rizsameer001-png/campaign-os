import { prisma } from '../config/db.js';
import { logger } from '../utils/logger.js';

/**
 * SEC-008: writes an audit_logs row for sensitive operations. Called
 * explicitly from services (not blanket-applied to every route), since it
 * needs semantic action names and before/after values that only the
 * service layer knows.
 *
 *   await recordAudit({ userId, action: 'user.suspend', entityType: 'User',
 *     entityId, oldValues: { status: 'active' }, newValues: { status: 'suspended' }, req });
 */
export async function recordAudit({ userId, action, entityType, entityId, oldValues, newValues, req }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        entityType,
        entityId: entityId ?? null,
        oldValues: oldValues ?? undefined,
        newValues: newValues ?? undefined,
        ipAddress: req?.ip ?? null,
        userAgent: req?.headers?.['user-agent'] ?? null,
      },
    });
  } catch (err) {
    // Audit logging must never break the primary request flow.
    logger.error('Failed to write audit log', { action, entityType, error: err.message });
  }
}

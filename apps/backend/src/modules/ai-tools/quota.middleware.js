import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { sendError } from '../../utils/responseFormatter.js';

/** Computes current-month AI spend vs quota without blocking anything. */
export async function getQuotaStatus(userId) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const usage = await prisma.aiUsageLog.aggregate({
    where: { userId, createdAt: { gte: startOfMonth } },
    _sum: { costInr: true },
  });

  const spent = usage._sum.costInr ?? 0;
  const quota = env.AI_MONTHLY_QUOTA_INR;
  const percentUsed = quota > 0 ? (spent / quota) * 100 : 0;

  return { spent, quota, percentUsed, warning: percentUsed >= 80, blocked: percentUsed >= 100 };
}

/**
 * AIH-U-002/003: checks this candidate's AI spend for the current calendar
 * month against AI_MONTHLY_QUOTA_INR. Blocks at 100%, but still lets the
 * request through with a warning flag at 80% so the frontend can show a
 * QuotaMeter nudge (upgrade prompt) without interrupting the tool.
 */
export async function enforceAiQuota(req, res, next) {
  try {
    const status = await getQuotaStatus(req.user.id);

    if (status.blocked) {
      return sendError(res, {
        status: 429,
        message: 'Monthly AI usage quota reached. Upgrade your plan to continue using AI tools.',
      });
    }

    req.aiQuota = status;
    next();
  } catch (err) {
    next(err);
  }
}

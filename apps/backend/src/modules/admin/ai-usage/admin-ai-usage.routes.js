import { Router } from 'express';
import { prisma } from '../../../config/db.js';
import { env } from '../../../config/env.js';
import { authenticate } from '../../../middleware/authenticate.js';
import { authorize } from '../../../middleware/authorize.js';
import { validateRequest } from '../../../middleware/validateRequest.js';
import { sendSuccess, sendPaginated } from '../../../utils/responseFormatter.js';
import { z } from 'zod';

const router = Router();
router.use(authenticate, authorize('admin', 'super_admin'));

// AD-AI-001: real-time request log
router.get('/logs', async (req, res, next) => {
  try {
    const { userId, toolType, status, page = 1, limit = 50 } = req.query;
    const where = { ...(userId ? { userId } : {}), ...(toolType ? { toolType } : {}), ...(status ? { status } : {}) };

    const [items, total] = await Promise.all([
      prisma.aiUsageLog.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (Number(page) - 1) * Number(limit), take: Number(limit),
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.aiUsageLog.count({ where }),
    ]);
    return sendPaginated(res, { items, page: Number(page), limit: Number(limit), total });
  } catch (err) { next(err); }
});

// AD-AI-002: aggregate stats
router.get('/aggregate', async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalToday, byUser, byTool, errorCount, totalCount] = await Promise.all([
      prisma.aiUsageLog.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.aiUsageLog.groupBy({ by: ['userId'], _sum: { costInr: true }, _count: true, orderBy: { _sum: { costInr: 'desc' } }, take: 10 }),
      prisma.aiUsageLog.groupBy({ by: ['toolType'], _sum: { costInr: true } }),
      prisma.aiUsageLog.count({ where: { status: 'error' } }),
      prisma.aiUsageLog.count(),
    ]);

    return sendSuccess(res, {
      data: {
        totalRequestsToday: totalToday,
        topUsersByUsage: byUser,
        costPerTool: byTool.map((t) => ({ toolType: t.toolType, totalCostInr: t._sum.costInr ?? 0 })),
        errorRate: totalCount === 0 ? 0 : Math.round((errorCount / totalCount) * 100),
      },
    });
  } catch (err) { next(err); }
});

// AD-AI-003: monthly billing report per candidate
router.get('/billing/:userId', async (req, res, next) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = await prisma.aiUsageLog.aggregate({
      where: { userId: req.params.userId, createdAt: { gte: startOfMonth } },
      _sum: { costInr: true, inputTokens: true, outputTokens: true },
      _count: true,
    });

    return sendSuccess(res, {
      data: {
        totalCostInr: usage._sum.costInr ?? 0,
        totalRequests: usage._count,
        totalInputTokens: usage._sum.inputTokens ?? 0,
        totalOutputTokens: usage._sum.outputTokens ?? 0,
        quota: env.AI_MONTHLY_QUOTA_INR,
      },
    });
  } catch (err) { next(err); }
});

// AD-AI-004: set global quota (per-user override lives in system_settings
// keyed by user id, checked by quota.middleware.js's getQuotaStatus if you
// extend it to look there first — noted as the extension point)
router.put('/quota', validateRequest(z.object({ monthlyQuotaInr: z.number().positive() })), async (req, res, next) => {
  try {
    await prisma.systemSetting.upsert({
      where: { key: 'ai_monthly_quota_inr' },
      update: { value: req.body.monthlyQuotaInr, updatedBy: req.user.id },
      create: { key: 'ai_monthly_quota_inr', value: req.body.monthlyQuotaInr, updatedBy: req.user.id },
    });
    return sendSuccess(res, { message: 'Global AI quota updated (takes effect on next deploy/restart with the value read from system_settings)' });
  } catch (err) { next(err); }
});

export default router;

import { Router } from 'express';
import { prisma } from '../../../config/db.js';
import { authenticate } from '../../../middleware/authenticate.js';
import { authorize } from '../../../middleware/authorize.js';
import { sendSuccess } from '../../../utils/responseFormatter.js';

const router = Router();
router.use(authenticate, authorize('admin', 'super_admin'));

router.get('/', async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalCandidates, activeCampaigns, totalVolunteers, aiRequestsToday, pendingApprovals, recentSignups] = await Promise.all([
      prisma.user.count({ where: { role: 'candidate', deletedAt: null } }),
      prisma.campaignPlan.count({ where: { status: 'active' } }),
      prisma.volunteer.count({ where: { status: 'approved' } }),
      prisma.aiUsageLog.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { status: 'pending_approval' } }),
      prisma.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
    ]);

    return sendSuccess(res, {
      data: { totalCandidates, activeCampaigns, totalVolunteers, aiRequestsToday, pendingApprovals, recentSignups },
    });
  } catch (err) { next(err); }
});

router.get('/signups-trend', async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const users = await prisma.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    });

    const byDay = {};
    for (const u of users) {
      const day = u.createdAt.toISOString().slice(0, 10);
      byDay[day] = (byDay[day] ?? 0) + 1;
    }

    return sendSuccess(res, { data: Object.entries(byDay).map(([date, count]) => ({ date, count })) });
  } catch (err) { next(err); }
});

router.get('/ai-usage-by-tool', async (req, res, next) => {
  try {
    const logs = await prisma.aiUsageLog.groupBy({ by: ['toolType'], _count: true });
    return sendSuccess(res, { data: logs.map((l) => ({ toolType: l.toolType, count: l._count })) });
  } catch (err) { next(err); }
});

export default router;

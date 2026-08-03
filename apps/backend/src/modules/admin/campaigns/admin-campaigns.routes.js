import { Router } from 'express';
import { prisma } from '../../../config/db.js';
import { authenticate } from '../../../middleware/authenticate.js';
import { authorize } from '../../../middleware/authorize.js';
import { sendSuccess, sendPaginated } from '../../../utils/responseFormatter.js';

const router = Router();
router.use(authenticate, authorize('admin', 'super_admin'));

router.get('/', async (req, res, next) => {
  try {
    const { state, minScore, maxScore, page = 1, limit = 25 } = req.query;

    const candidates = await prisma.user.findMany({
      where: { role: 'candidate', deletedAt: null, ...(state ? { state } : {}) },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      select: { id: true, name: true, constituencyName: true, state: true },
    });

    const campaigns = await Promise.all(
      candidates.map(async (c) => {
        const [latestReport, volunteerCount, latestMetric] = await Promise.all([
          prisma.readinessReport.findFirst({ where: { userId: c.id }, orderBy: { createdAt: 'desc' } }),
          prisma.volunteer.count({ where: { candidateId: c.id, status: 'approved' } }),
          prisma.campaignMetric.findFirst({ where: { userId: c.id }, orderBy: { metricDate: 'desc' } }),
        ]);

        return {
          candidateId: c.id,
          candidateName: c.name,
          constituency: c.constituencyName,
          state: c.state,
          readinessScore: latestReport?.overallScore ?? null,
          volunteerCount,
          boothCoverage: latestMetric?.boothsCovered ?? null,
          lastActivity: latestMetric?.updatedAt ?? null,
        };
      })
    );

    const filtered = campaigns.filter((c) => {
      if (minScore && (c.readinessScore ?? 0) < Number(minScore)) return false;
      if (maxScore && (c.readinessScore ?? 100) > Number(maxScore)) return false;
      return true;
    });

    return sendPaginated(res, { items: filtered, page: Number(page), limit: Number(limit), total: filtered.length });
  } catch (err) { next(err); }
});

router.get('/:candidateId', async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const [readinessReports, campaignPlans, volunteers, metrics] = await Promise.all([
      prisma.readinessReport.findMany({ where: { userId: candidateId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.campaignPlan.findMany({ where: { userId: candidateId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.volunteer.count({ where: { candidateId } }),
      prisma.campaignMetric.findMany({ where: { userId: candidateId }, orderBy: { metricDate: 'desc' }, take: 30 }),
    ]);
    return sendSuccess(res, { data: { readinessReports, campaignPlans, volunteerCount: volunteers, metrics } });
  } catch (err) { next(err); }
});

router.get('/flags/list', async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const candidates = await prisma.user.findMany({ where: { role: 'candidate', deletedAt: null }, select: { id: true, name: true } });

    const flagged = [];
    for (const c of candidates) {
      const [volunteerCount, recentMetric] = await Promise.all([
        prisma.volunteer.count({ where: { candidateId: c.id } }),
        prisma.campaignMetric.findFirst({ where: { userId: c.id }, orderBy: { metricDate: 'desc' } }),
      ]);

      const flags = [];
      if (volunteerCount === 0) flags.push('zero_volunteers');
      if (!recentMetric || recentMetric.updatedAt < sevenDaysAgo) flags.push('no_recent_activity');
      if (recentMetric && recentMetric.sentimentScore < -20) flags.push('low_sentiment');

      if (flags.length > 0) flagged.push({ candidateId: c.id, candidateName: c.name, flags });
    }

    return sendSuccess(res, { data: flagged });
  } catch (err) { next(err); }
});

export default router;

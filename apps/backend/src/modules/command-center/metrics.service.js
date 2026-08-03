import { prisma } from '../../config/db.js';
import { computeBoothCoveragePercent } from '../volunteers/booths/booths.service.js';

function todayDateOnly() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * LCC-M-004: sentiment score derived from social mentions + survey feedback
 * via AI NLP per the FRD. No social API integration exists yet in this
 * build (LCC-D-003 is a Could Have), so this computes a heuristic proxy
 * from survey/task/booth activity instead of returning a fake AI number —
 * swap in a real NLP pipeline here once social API access is wired up.
 */
async function computeHeuristicSentiment(candidateId) {
  const recentTasks = await prisma.task.findMany({
    where: { candidateId, createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
  });
  if (recentTasks.length === 0) return 0;

  const completed = recentTasks.filter((t) => t.status === 'completed').length;
  const completionRatio = completed / recentTasks.length;
  // Maps 0-1 completion ratio onto a -100..+100 scale, centered so 50%
  // completion reads as neutral (0) rather than punishing normal campaigns.
  return Math.round((completionRatio - 0.5) * 200);
}

// LCC-M-001..010: the full snapshot the dashboard needs in one call.
export async function getLiveSnapshot(candidateId) {
  const [totalVolunteers, activeVolunteers24h, boothCoveragePercent, surveyCount, sentimentScore] = await Promise.all([
    prisma.volunteer.count({ where: { candidateId, status: 'approved' } }),
    prisma.attendance.count({
      where: { volunteer: { candidateId }, status: 'present', createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
    computeBoothCoveragePercent(candidateId),
    prisma.boothReport.count({ where: { volunteer: { candidateId } } }), // proxy for survey submissions until a dedicated Survey model exists
    computeHeuristicSentiment(candidateId),
  ]);

  const latestMetric = await prisma.campaignMetric.findFirst({
    where: { userId: candidateId },
    orderBy: { metricDate: 'desc' },
  });

  const snapshot = {
    totalVolunteers,
    activeVolunteers24h,
    boothCoveragePercent,
    sentimentScore,
    surveyCount,
    socialReach: latestMetric ? Number(latestMetric.socialReach) : 0,
    fundsUtilizedPercent: latestMetric?.fundsUtilized ?? 0,
  };

  // LCC-M-007: alert on threshold breach
  if (sentimentScore < -20 || boothCoveragePercent < 50) {
    const { sendCampaignAlert } = await import('../notifications/notifications.service.js');
    await sendCampaignAlert(candidateId, {
      title: 'Campaign metric alert',
      message: sentimentScore < -20
        ? `Sentiment score dropped to ${sentimentScore}.`
        : `Booth coverage dropped to ${boothCoveragePercent}%.`,
      metadata: snapshot,
    }).catch(() => {});
  }

  return snapshot;
}

// LCC-M-008/010: daily rollup upsert + date-range time-series read
export async function upsertDailyMetric(candidateId) {
  const snapshot = await getLiveSnapshot(candidateId);
  const metricDate = todayDateOnly();

  return prisma.campaignMetric.upsert({
    where: { userId_metricDate: { userId: candidateId, metricDate } },
    update: {
      volunteersActive: snapshot.activeVolunteers24h,
      boothsCovered: snapshot.boothCoveragePercent,
      sentimentScore: snapshot.sentimentScore,
      surveyCount: snapshot.surveyCount,
    },
    create: {
      userId: candidateId,
      metricDate,
      volunteersActive: snapshot.activeVolunteers24h,
      boothsCovered: snapshot.boothCoveragePercent,
      sentimentScore: snapshot.sentimentScore,
      surveyCount: snapshot.surveyCount,
      socialReach: BigInt(0),
      fundsUtilized: 0,
    },
  });
}

// LCC-M-010: ?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function getMetricsTimeSeries(candidateId, { from, to }) {
  return prisma.campaignMetric.findMany({
    where: {
      userId: candidateId,
      ...(from || to ? { metricDate: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
    },
    orderBy: { metricDate: 'asc' },
  });
}

// LCC-M-009: admin aggregate across all campaigns (anonymized — no candidate names/PII)
export async function getAggregatedMetrics() {
  const metrics = await prisma.campaignMetric.findMany({
    where: { metricDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
  });

  if (metrics.length === 0) return { avgBoothCoverage: 0, avgSentiment: 0, totalActiveVolunteers: 0 };

  return {
    avgBoothCoverage: Math.round(metrics.reduce((s, m) => s + m.boothsCovered, 0) / metrics.length),
    avgSentiment: Math.round(metrics.reduce((s, m) => s + m.sentimentScore, 0) / metrics.length),
    totalActiveVolunteers: metrics.reduce((s, m) => s + m.volunteersActive, 0),
  };
}

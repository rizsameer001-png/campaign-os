import { prisma } from '../../config/db.js';
import { computeBoothCoveragePercent } from '../volunteers/booths/booths.service.js';
import { computePlanProgress } from '../campaign-planner/campaign-plan.service.js';

// RAS-001: candidate-level combined report
export async function getCandidateOverviewReport(userId) {
  const [latestReadiness, campaignPlans, volunteerCount, aiUsage, tasks] = await Promise.all([
    prisma.readinessReport.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.campaignPlan.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.volunteer.count({ where: { candidateId: userId, status: 'approved' } }),
    prisma.aiUsageLog.aggregate({ where: { userId }, _sum: { costInr: true }, _count: true }),
    prisma.task.groupBy({ by: ['status'], where: { candidateId: userId }, _count: true }),
  ]);

  const boothCoveragePercent = await computeBoothCoveragePercent(userId);

  return {
    readiness: latestReadiness ? { score: latestReadiness.overallScore, calculatedAt: latestReadiness.createdAt } : null,
    campaignPlans: campaignPlans.map((p) => ({ id: p.id, title: p.title, progress: computePlanProgress(p) })),
    volunteerCount,
    boothCoveragePercent,
    aiUsage: { totalRequests: aiUsage._count, totalCostInr: aiUsage._sum.costInr ?? 0 },
    taskBreakdown: tasks.map((t) => ({ status: t.status, count: t._count })),
  };
}

// RAS-002: admin-level platform overview
export async function getAdminPlatformOverviewReport() {
  const [totalUsers, totalCandidates, totalVolunteers, totalAiCost, totalLeads, convertedLeads] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { role: 'candidate', deletedAt: null } }),
    prisma.volunteer.count({ where: { status: 'approved' } }),
    prisma.aiUsageLog.aggregate({ _sum: { costInr: true } }),
    prisma.lead.count(),
    prisma.lead.count({ where: { status: 'converted' } }),
  ]);

  return {
    totalUsers,
    totalCandidates,
    totalVolunteers,
    totalAiCostInr: totalAiCost._sum.costInr ?? 0,
    leadConversionRate: totalLeads === 0 ? 0 : Math.round((convertedLeads / totalLeads) * 100),
  };
}

// RAS-001: volunteer engagement report (admin or candidate-scoped)
export async function getVolunteerEngagementReport(candidateId) {
  const volunteers = await prisma.volunteer.findMany({ where: { candidateId }, select: { id: true, name: true } });

  const rows = await Promise.all(
    volunteers.map(async (v) => {
      const [taskCount, completedCount, attendanceCount] = await Promise.all([
        prisma.task.count({ where: { volunteerId: v.id } }),
        prisma.task.count({ where: { volunteerId: v.id, status: 'completed' } }),
        prisma.attendance.count({ where: { volunteerId: v.id, status: 'present' } }),
      ]);
      return {
        volunteerId: v.id,
        name: v.name,
        taskCount,
        completedCount,
        completionRate: taskCount === 0 ? 0 : Math.round((completedCount / taskCount) * 100),
        daysPresent: attendanceCount,
      };
    })
  );

  return rows;
}

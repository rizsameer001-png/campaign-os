import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { allowedOrigins } from './config/env.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { roleAwareLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { sendSuccess } from './utils/responseFormatter.js';
import { prisma } from './config/db.js';

import authRoutes from './modules/auth/auth.routes.js';
import candidateRoutes from './modules/candidate/candidate.routes.js';
import mediaRoutes from './modules/media/media.routes.js';
import notificationRoutes from './modules/notifications/notifications.routes.js';
import readinessRoutes from './modules/readiness/readiness.routes.js';
import constituencyRoutes from './modules/constituency/constituency.routes.js';
import campaignPlanRoutes from './modules/campaign-planner/campaign-plan.routes.js';
import aiToolsRoutes from './modules/ai-tools/ai-tools.routes.js';

import volunteersRoutes from './modules/volunteers/volunteers.routes.js';
import tasksRoutes from './modules/volunteers/tasks/tasks.routes.js';
import boothsRoutes from './modules/volunteers/booths/booths.routes.js';
import attendanceRoutes from './modules/volunteers/attendance/attendance.routes.js';
import ralliesRoutes from './modules/volunteers/rallies/rallies.routes.js';

import commandCenterRoutes from './modules/command-center/metrics.routes.js';

import adminUsersRoutes from './modules/admin/users/admin-users.routes.js';
import adminDashboardRoutes from './modules/admin/dashboard/admin-dashboard.routes.js';
import adminCampaignsRoutes from './modules/admin/campaigns/admin-campaigns.routes.js';
import adminSettingsRoutes from './modules/admin/settings/admin-settings.routes.js';
import adminAuditRoutes from './modules/admin/audit/admin-audit.routes.js';
import adminLeadsRoutes from './modules/admin/leads/admin-leads.routes.js';
import adminAiUsageRoutes from './modules/admin/ai-usage/admin-ai-usage.routes.js';

import publicRoutes from './modules/public/public.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';

export const app = express();

app.use(securityHeaders);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // needed for the httpOnly refresh-token cookie
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(roleAwareLimiter);

// DEP-002: health check for Render/uptime monitors
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return sendSuccess(res, { data: { db: 'connected', uptime: process.uptime() } });
  } catch {
    return res.status(503).json({ success: false, data: null, message: 'Database unreachable', errors: [] });
  }
});

// --- Part 1 routes ---
app.use('/api/auth', authRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/notifications', notificationRoutes);

// --- Part 2 routes ---
app.use('/api/readiness', readinessRoutes);
app.use('/api/constituency', constituencyRoutes);
app.use('/api/ai/campaign-plans', campaignPlanRoutes);
app.use('/api/ai', aiToolsRoutes);

// --- Part 3 routes ---
app.use('/api/volunteers', volunteersRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/booths', boothsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/rallies', ralliesRoutes);

app.use('/api/dashboard', commandCenterRoutes);

app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/campaigns', adminCampaignsRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/admin/audit-logs', adminAuditRoutes);
app.use('/api/admin/leads', adminLeadsRoutes);
app.use('/api/admin/ai-usage', adminAiUsageRoutes);

app.use('/api/public', publicRoutes);
app.use('/api/reports', reportsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

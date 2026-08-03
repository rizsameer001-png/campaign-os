import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { sendSuccess } from '../../utils/responseFormatter.js';
import { toCsv } from '../../utils/csvExporter.js';
import * as reportsService from './reports.service.js';

const router = Router();

router.get('/candidate/overview', authenticate, authorize('candidate'), async (req, res, next) => {
  try {
    const report = await reportsService.getCandidateOverviewReport(req.user.id);
    return sendSuccess(res, { data: report });
  } catch (err) { next(err); }
});

router.get('/candidate/volunteer-engagement', authenticate, authorize('candidate'), async (req, res, next) => {
  try {
    const report = await reportsService.getVolunteerEngagementReport(req.user.id);
    return sendSuccess(res, { data: report });
  } catch (err) { next(err); }
});

router.get('/candidate/volunteer-engagement/csv', authenticate, authorize('candidate'), async (req, res, next) => {
  try {
    const report = await reportsService.getVolunteerEngagementReport(req.user.id);
    const csv = toCsv(report, [
      { key: 'name', label: 'Name' },
      { key: 'taskCount', label: 'Tasks Assigned' },
      { key: 'completedCount', label: 'Tasks Completed' },
      { key: 'completionRate', label: 'Completion Rate %' },
      { key: 'daysPresent', label: 'Days Present' },
    ]);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="volunteer-engagement.csv"');
    return res.send(csv);
  } catch (err) { next(err); }
});

router.get('/admin/platform-overview', authenticate, authorize('admin', 'super_admin'), async (req, res, next) => {
  try {
    const report = await reportsService.getAdminPlatformOverviewReport();
    return sendSuccess(res, { data: report });
  } catch (err) { next(err); }
});

export default router;

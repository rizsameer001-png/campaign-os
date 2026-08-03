import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { sendSuccess } from '../../utils/responseFormatter.js';
import * as metricsService from './metrics.service.js';

const router = Router();

// LCC-M-001: full live snapshot
router.get('/', authenticate, authorize('candidate'), async (req, res, next) => {
  try {
    const snapshot = await metricsService.getLiveSnapshot(req.user.id);
    return sendSuccess(res, { data: snapshot });
  } catch (err) { next(err); }
});

// Triggers today's rollup write — a real deployment would cron this every
// 30s/few minutes (LCC-M-002); exposed on-demand here for Part 3's scope.
router.post('/rollup', authenticate, authorize('candidate'), async (req, res, next) => {
  try {
    const result = await metricsService.upsertDailyMetric(req.user.id);
    return sendSuccess(res, { data: result, message: 'Metrics rolled up' });
  } catch (err) { next(err); }
});

// API-CANDIDATE: GET /api/dashboard/metrics?from=&to= (time-series)
router.get('/metrics', authenticate, authorize('candidate'), async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const result = await metricsService.getMetricsTimeSeries(req.user.id, { from, to });
    return sendSuccess(res, { data: result });
  } catch (err) { next(err); }
});

// LCC-M-009
router.get('/aggregate', authenticate, authorize('admin', 'super_admin'), async (req, res, next) => {
  try {
    const result = await metricsService.getAggregatedMetrics();
    return sendSuccess(res, { data: result });
  } catch (err) { next(err); }
});

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../../middleware/authenticate.js';
import { authorize } from '../../../middleware/authorize.js';
import { validateRequest } from '../../../middleware/validateRequest.js';
import { sendSuccess, sendPaginated } from '../../../utils/responseFormatter.js';
import * as ralliesService from './rallies.service.js';

const router = Router();

router.post('/report', authenticate, authorize('volunteer'), validateRequest(z.object({
  rallyName: z.string().min(1),
  location: z.string().min(1),
  crowdEstimate: z.number().int().nonnegative().optional(),
  photos: z.array(z.string().url()).max(5).optional(),
  issuesFaced: z.string().optional(),
})), async (req, res, next) => {
  try {
    const result = await ralliesService.submitRallyReport(req.user.id, req.body);
    return sendSuccess(res, { data: result, message: 'Rally report submitted', status: 201 });
  } catch (err) { next(err); }
});

router.get('/', authenticate, authorize('candidate'), async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await ralliesService.listRallyReports(req.user.id, { page: page ? Number(page) : 1, limit: limit ? Number(limit) : 25 });
    return sendPaginated(res, result);
  } catch (err) { next(err); }
});

export default router;

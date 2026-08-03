import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../../middleware/authenticate.js';
import { authorize } from '../../../middleware/authorize.js';
import { validateRequest } from '../../../middleware/validateRequest.js';
import { sendSuccess } from '../../../utils/responseFormatter.js';
import * as boothsService from './booths.service.js';

const router = Router();

const geolocationSchema = z.object({ lat: z.number(), lng: z.number() }).optional();

router.put('/:volunteerId/assign', authenticate, authorize('candidate'), validateRequest(z.object({ boothId: z.string().min(1) })), async (req, res, next) => {
  try {
    const result = await boothsService.assignBooth(req.user.id, req.params.volunteerId, req.body.boothId);
    return sendSuccess(res, { data: result, message: 'Booth assigned' });
  } catch (err) { next(err); }
});

router.get('/coverage-map', authenticate, authorize('candidate'), async (req, res, next) => {
  try {
    const result = await boothsService.getBoothCoverageMap(req.user.id);
    return sendSuccess(res, { data: result });
  } catch (err) { next(err); }
});

// API-CANDIDATE: POST /api/booths/checkin (volunteer)
router.post('/checkin', authenticate, authorize('volunteer'), validateRequest(z.object({ boothId: z.string().min(1), geolocation: geolocationSchema })), async (req, res, next) => {
  try {
    const result = await boothsService.checkIn(req.user.id, req.body);
    return sendSuccess(res, { data: result, message: 'Checked in', status: 201 });
  } catch (err) { next(err); }
});

// API-CANDIDATE: POST /api/booths/report (volunteer)
router.post('/report', authenticate, authorize('volunteer'), validateRequest(z.object({
  boothId: z.string().min(1),
  turnoutEstimate: z.number().int().nonnegative().optional(),
  issuesReported: z.string().optional(),
  photos: z.array(z.string().url()).optional(),
  geolocation: geolocationSchema,
})), async (req, res, next) => {
  try {
    const result = await boothsService.submitBoothReport(req.user.id, req.body);
    return sendSuccess(res, { data: result, message: 'Booth report submitted', status: 201 });
  } catch (err) { next(err); }
});

router.put('/critical', authenticate, authorize('candidate'), validateRequest(z.object({ boothIds: z.array(z.string()) })), async (req, res, next) => {
  try {
    const result = await boothsService.flagCriticalBooths(req.user.id, req.body.boothIds);
    return sendSuccess(res, { data: result, message: result.message });
  } catch (err) { next(err); }
});

export default router;

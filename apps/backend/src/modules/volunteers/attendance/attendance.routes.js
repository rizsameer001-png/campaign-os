import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../../middleware/authenticate.js';
import { authorize } from '../../../middleware/authorize.js';
import { validateRequest } from '../../../middleware/validateRequest.js';
import { sendSuccess } from '../../../utils/responseFormatter.js';
import { prisma } from '../../../config/db.js';
import * as attendanceService from './attendance.service.js';

const router = Router();

// API-CANDIDATE: POST /api/attendance (volunteer)
router.post('/', authenticate, authorize('volunteer'), validateRequest(z.object({
  status: z.enum(['present', 'absent', 'late']),
  geolocation: z.object({ lat: z.number(), lng: z.number() }).optional(),
})), async (req, res, next) => {
  try {
    const result = await attendanceService.markAttendance(req.user.id, req.body);
    return sendSuccess(res, { data: result, message: 'Attendance marked' });
  } catch (err) { next(err); }
});

router.get('/me', authenticate, authorize('volunteer'), async (req, res, next) => {
  try {
    const volunteer = await prisma.volunteer.findUnique({ where: { userId: req.user.id } });
    const { from, to } = req.query;
    const records = await attendanceService.listAttendance(volunteer.id, { from, to });
    const summary = await attendanceService.getAttendanceSummary(volunteer.id);
    return sendSuccess(res, { data: { records, summary } });
  } catch (err) { next(err); }
});

router.get('/overview', authenticate, authorize('candidate'), async (req, res, next) => {
  try {
    const result = await attendanceService.getCandidateAttendanceOverview(req.user.id);
    return sendSuccess(res, { data: result });
  } catch (err) { next(err); }
});

export default router;

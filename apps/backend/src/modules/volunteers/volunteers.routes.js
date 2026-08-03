import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import * as volunteersController from './volunteers.controller.js';

const router = Router();

const inviteSchema = z.object({ email: z.string().email() });
const signupSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(2),
  phone: z.string().min(10),
  password: z.string().min(8),
  address: z.string().optional(),
  assignedBooth: z.string().optional(),
});
const reviewSchema = z.object({ decision: z.enum(['approve', 'reject']) });

// VMS-O-001: API-CANDIDATE POST /api/volunteers/invite
router.post('/invite', authenticate, authorize('candidate'), validateRequest(inviteSchema), volunteersController.invite);

// VMS-O-003: public - token-gated, not role-gated
router.post('/signup', validateRequest(signupSchema), volunteersController.completeSignup);

router.put('/:id/review', authenticate, authorize('candidate'), validateRequest(reviewSchema), volunteersController.review);

router.get('/', authenticate, authorize('candidate'), volunteersController.list);
router.get('/:id', authenticate, authorize('candidate'), volunteersController.getOne);
router.put('/:id', authenticate, authorize('candidate'), volunteersController.update);
router.delete('/:id', authenticate, authorize('candidate'), volunteersController.remove);

export default router;

import { Router } from 'express';
import * as readinessController from './readiness.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { readinessInputSchema } from './readiness.validation.js';

const router = Router();

// ERE-I-003: draft autosave — partial input allowed, so no full-schema validation here.
router.put('/draft', authenticate, authorize('candidate'), readinessController.saveDraft);

// API-CANDIDATE: POST /api/readiness/calculate
router.post(
  '/calculate',
  authenticate,
  authorize('candidate'),
  validateRequest(readinessInputSchema),
  readinessController.calculate
);

router.get('/reports', authenticate, authorize('candidate'), readinessController.listReports);
router.get('/reports/:id', authenticate, authorize('candidate'), readinessController.getReport);
router.post('/reports/:id/share', authenticate, authorize('candidate'), readinessController.createShareLink);

// ERE-O-005: public, unauthenticated — token-gated instead
router.get('/shared/:token', readinessController.getSharedReport);

export default router;

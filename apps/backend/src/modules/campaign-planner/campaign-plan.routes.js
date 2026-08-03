import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { enforceAiQuota } from '../ai-tools/quota.middleware.js';
import * as planController from './campaign-plan.controller.js';

const router = Router();

router.use(authenticate, authorize('candidate'));

const generateSchema = z.object({
  title: z.string().optional(),
  budget: z.number().int().positive(),
  electionType: z.enum(['assembly', 'general', 'local']),
  state: z.string().min(1),
  constituency: z.string().min(1),
  daysUntilElection: z.number().int().positive(),
  targetVoterSegment: z.string().optional(),
});

const itemUpdateSchema = z.object({
  weekNumber: z.number().int().positive(),
  itemId: z.string().uuid(),
  status: z.enum(['pending', 'in_progress', 'completed']),
});

const itemAddSchema = z.object({
  weekNumber: z.number().int().positive(),
  category: z.enum(['digital', 'ground', 'milestone', 'custom']),
  title: z.string().min(1),
});

// ACP-G-001..008 (quota-gated since generation calls the AI provider)
router.post('/', enforceAiQuota, validateRequest(generateSchema), planController.generate);
router.post('/:id/regenerate', enforceAiQuota, planController.regenerate);

router.get('/', planController.list);
router.get('/:id', planController.getOne);

// ACP-M-001..003 (no AI call, no quota gate)
router.put('/:id/item', validateRequest(itemUpdateSchema), planController.updateItem);
router.post('/:id/item', validateRequest(itemAddSchema), planController.addItem);

export default router;

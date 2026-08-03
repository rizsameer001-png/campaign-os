import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { sendSuccess, sendPaginated } from '../../utils/responseFormatter.js';
import * as constituencyService from './constituency.service.js';
import { bulkImport } from './constituency-bulk-import.service.js';

const router = Router();

const constituencySchema = z.object({
  name: z.string().min(1),
  state: z.string().min(1),
  population: z.number().int().positive(),
  genderRatio: z.number().min(800).max(1200), // CI-D-005
  literacyRate: z.number().min(0).max(100),
  urbanPercent: z.number().min(0).max(100),
  pastWinner: z.string().optional(),
  pastWinnerParty: z.string().optional(),
  victoryMarginVotes: z.number().int().optional(),
  victoryMarginPercent: z.number().optional(),
  demographics: z.record(z.any()).optional(),
  electionHistory: z.array(z.any()).optional(),
  dataSource: z.string().optional(),
});

// --- Candidate/volunteer read access (CI-V-001..006) ---
router.get('/search', authenticate, async (req, res, next) => {
  try {
    const { query, state, electionType, minPopulation, maxPopulation, page, limit } = req.query;
    const result = await constituencyService.searchConstituencies({
      query,
      state,
      electionType,
      minPopulation: minPopulation ? Number(minPopulation) : undefined,
      maxPopulation: maxPopulation ? Number(maxPopulation) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    return sendPaginated(res, { items: result.items, page: result.page, limit: result.limit, total: result.total });
  } catch (err) { next(err); }
});

router.get('/compare', authenticate, async (req, res, next) => {
  try {
    const ids = (req.query.ids || '').split(',').filter(Boolean);
    const result = await constituencyService.compareConstituencies(ids);
    return sendSuccess(res, { data: result });
  } catch (err) { next(err); }
});

router.get('/:name', authenticate, authorize('candidate', 'volunteer'), async (req, res, next) => {
  try {
    const state = req.query.state;
    if (!state) throw new Error('state query param is required');
    const constituency = await constituencyService.getConstituency(req.params.name, state);
    return sendSuccess(res, { data: constituency });
  } catch (err) { next(err); }
});

// --- Admin CRUD (CI-D-003, AD-C-001..008) ---
router.post('/', authenticate, authorize('admin', 'super_admin'), validateRequest(constituencySchema), async (req, res, next) => {
  try {
    const result = await constituencyService.createConstituency(req.body);
    return sendSuccess(res, { data: result, message: 'Constituency created', status: 201 });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, authorize('admin', 'super_admin'), validateRequest(constituencySchema.partial()), async (req, res, next) => {
  try {
    const result = await constituencyService.updateConstituency(req.params.id, req.body);
    return sendSuccess(res, { data: result, message: 'Constituency updated' });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res, next) => {
  try {
    const result = await constituencyService.deleteConstituency(req.params.id);
    return sendSuccess(res, { data: result, message: result.message });
  } catch (err) { next(err); }
});

// CI-D-004/AD-C-004: bulk import — expects { "csv": "..." } as JSON
// (raw text/plain isn't parsed since only express.json() is mounted globally).
router.post('/bulk-import', authenticate, authorize('admin', 'super_admin'), async (req, res, next) => {
  try {
    if (!req.body?.csv) {
      return sendSuccess(res, { data: null, message: 'Send { "csv": "..." } with the full CSV text as a JSON string', status: 400 });
    }
    const result = await bulkImport(req.body.csv);
    return sendSuccess(res, { data: result, message: `Imported: ${result.created} created, ${result.updated} updated, ${result.failed.length} failed` });
  } catch (err) { next(err); }
});

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../../config/db.js';
import { authenticate } from '../../../middleware/authenticate.js';
import { authorize } from '../../../middleware/authorize.js';
import { validateRequest } from '../../../middleware/validateRequest.js';
import { sendSuccess, sendPaginated } from '../../../utils/responseFormatter.js';

const router = Router();
router.use(authenticate, authorize('admin', 'super_admin'));

router.get('/', async (req, res, next) => {
  try {
    const { status, source, assignedTo, page = 1, limit = 25 } = req.query;
    const where = { ...(status ? { status } : {}), ...(source ? { source } : {}), ...(assignedTo ? { assignedTo } : {}) };

    const [items, total] = await Promise.all([
      prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (Number(page) - 1) * Number(limit), take: Number(limit) }),
      prisma.lead.count({ where }),
    ]);
    return sendPaginated(res, { items, page: Number(page), limit: Number(limit), total });
  } catch (err) { next(err); }
});

router.put('/:id', validateRequest(z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'lost', 'converted']).optional(),
  assignedTo: z.string().uuid().optional(),
  notes: z.string().optional(),
})), async (req, res, next) => {
  try {
    const updated = await prisma.lead.update({ where: { id: req.params.id }, data: req.body });
    return sendSuccess(res, { data: updated, message: 'Lead updated' });
  } catch (err) { next(err); }
});

router.post('/:id/convert', async (req, res, next) => {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
    await prisma.lead.update({ where: { id: req.params.id }, data: { status: 'converted' } });
    return sendSuccess(res, {
      data: { prefill: { name: lead.name, email: lead.email, phone: lead.phone } },
      message: 'Lead marked converted. Use the prefill data to register the candidate account.',
    });
  } catch (err) { next(err); }
});

router.get('/analytics/summary', async (req, res, next) => {
  try {
    const bySource = await prisma.lead.groupBy({ by: ['source'], _count: true });
    const totalLeads = await prisma.lead.count();
    const converted = await prisma.lead.count({ where: { status: 'converted' } });

    return sendSuccess(res, {
      data: {
        bySource: bySource.map((s) => ({ source: s.source, count: s._count })),
        conversionRate: totalLeads === 0 ? 0 : Math.round((converted / totalLeads) * 100),
      },
    });
  } catch (err) { next(err); }
});

export default router;

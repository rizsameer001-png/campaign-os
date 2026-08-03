import { Router } from 'express';
import { prisma } from '../../../config/db.js';
import { authenticate } from '../../../middleware/authenticate.js';
import { authorize } from '../../../middleware/authorize.js';
import { sendPaginated } from '../../../utils/responseFormatter.js';

const router = Router();
router.use(authenticate, authorize('admin', 'super_admin'));

router.get('/', async (req, res, next) => {
  try {
    const { userId, action, entityType, from, to, page = 1, limit = 50 } = req.query;

    const where = {
      ...(userId ? { userId } : {}),
      ...(action ? { action: { contains: action } } : {}),
      ...(entityType ? { entityType } : {}),
      ...(from || to ? { createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return sendPaginated(res, { items, page: Number(page), limit: Number(limit), total });
  } catch (err) { next(err); }
});

export default router;

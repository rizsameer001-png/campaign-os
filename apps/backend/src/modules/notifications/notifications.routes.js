import { Router } from 'express';
import { prisma } from '../../config/db.js';
import { authenticate } from '../../middleware/authenticate.js';
import { sendSuccess } from '../../utils/responseFormatter.js';

const router = Router();

// CD-005 / NCS-001: unread count + recent list for the notification bell.
router.get('/', authenticate, async (req, res, next) => {
  try {
    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
    ]);
    return sendSuccess(res, { data: { items, unreadCount } });
  } catch (err) { next(err); }
});

router.put('/:id/read', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { isRead: true },
    });
    return sendSuccess(res, { message: 'Marked as read' });
  } catch (err) { next(err); }
});

router.put('/read-all', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    return sendSuccess(res, { message: 'All notifications marked as read' });
  } catch (err) { next(err); }
});

export default router;

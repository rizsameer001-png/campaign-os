import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../../config/db.js';
import { authenticate } from '../../../middleware/authenticate.js';
import { authorize } from '../../../middleware/authorize.js';
import { validateRequest } from '../../../middleware/validateRequest.js';
import { sendSuccess } from '../../../utils/responseFormatter.js';
import { recordAudit } from '../../../middleware/auditLogger.js';

const router = Router();

router.use(authenticate, authorize('super_admin'));

router.get('/', async (req, res, next) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    const asObject = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    return sendSuccess(res, { data: asObject });
  } catch (err) { next(err); }
});

router.put('/', validateRequest(z.object({ key: z.string().min(1), value: z.any() })), async (req, res, next) => {
  try {
    const { key, value } = req.body;
    const previous = await prisma.systemSetting.findUnique({ where: { key } });

    const updated = await prisma.systemSetting.upsert({
      where: { key },
      update: { value, updatedBy: req.user.id },
      create: { key, value, updatedBy: req.user.id },
    });

    await recordAudit({
      userId: req.user.id, action: 'settings.update', entityType: 'SystemSetting', entityId: key,
      oldValues: previous ? { value: previous.value } : null, newValues: { value }, req,
    });

    return sendSuccess(res, { data: updated, message: 'Setting updated' });
  } catch (err) { next(err); }
});

router.put('/maintenance-mode', validateRequest(z.object({ enabled: z.boolean(), message: z.string().optional() })), async (req, res, next) => {
  try {
    const value = { enabled: req.body.enabled, message: req.body.message ?? '' };
    const updated = await prisma.systemSetting.upsert({
      where: { key: 'maintenance_mode' },
      update: { value, updatedBy: req.user.id },
      create: { key: 'maintenance_mode', value, updatedBy: req.user.id },
    });
    return sendSuccess(res, { data: updated, message: 'Maintenance mode updated' });
  } catch (err) { next(err); }
});

router.put('/feature-flags', validateRequest(z.object({ flags: z.record(z.boolean()) })), async (req, res, next) => {
  try {
    const updated = await prisma.systemSetting.upsert({
      where: { key: 'feature_flags' },
      update: { value: req.body.flags, updatedBy: req.user.id },
      create: { key: 'feature_flags', value: req.body.flags, updatedBy: req.user.id },
    });
    return sendSuccess(res, { data: updated, message: 'Feature flags updated' });
  } catch (err) { next(err); }
});

export default router;

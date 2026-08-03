import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { authenticate } from '../../../middleware/authenticate.js';
import { authorize } from '../../../middleware/authorize.js';
import { validateRequest } from '../../../middleware/validateRequest.js';
import { sendSuccess, sendPaginated } from '../../../utils/responseFormatter.js';
import * as adminUsersService from './admin-users.service.js';

const router = Router();
router.use(authenticate, authorize('admin', 'super_admin'));

router.get('/', async (req, res, next) => {
  try {
    const { role, status, state, search, page, limit, sortBy, sortOrder } = req.query;
    const result = await adminUsersService.listUsers({
      role, status, state, search,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 25,
      sortBy, sortOrder,
    });
    return sendPaginated(res, result);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await adminUsersService.getUserDetail(req.params.id);
    return sendSuccess(res, { data: result });
  } catch (err) { next(err); }
});

router.post('/:id/approve', async (req, res, next) => {
  try {
    const result = await adminUsersService.approveCandidate(req.params.id, req.user.id, req);
    return sendSuccess(res, { data: result, message: 'Candidate approved' });
  } catch (err) { next(err); }
});

router.post('/:id/suspend', validateRequest(z.object({ reason: z.string().optional() })), async (req, res, next) => {
  try {
    const result = await adminUsersService.suspendUser(req.params.id, req.user.id, req.body.reason, req);
    return sendSuccess(res, { data: result, message: 'User suspended' });
  } catch (err) { next(err); }
});

router.post('/:id/ban', validateRequest(z.object({ reason: z.string().optional() })), async (req, res, next) => {
  try {
    const result = await adminUsersService.banUser(req.params.id, req.user.id, req.body.reason, req);
    return sendSuccess(res, { data: result, message: 'User banned' });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await adminUsersService.softDeleteUser(req.params.id, req.user.id, req);
    return sendSuccess(res, { data: result, message: 'User deleted' });
  } catch (err) { next(err); }
});

router.post('/bulk', validateRequest(z.object({
  userIds: z.array(z.string().uuid()).min(1),
  action: z.enum(['approve', 'suspend', 'ban', 'delete']),
})), async (req, res, next) => {
  try {
    const result = await adminUsersService.bulkAction(req.body.userIds, req.body.action, req.user.id, req);
    return sendSuccess(res, { data: result, message: `Bulk ${req.body.action} complete` });
  } catch (err) { next(err); }
});

router.post('/admins', authorize('super_admin'), validateRequest(z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(8),
})), async (req, res, next) => {
  try {
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const result = await adminUsersService.createAdmin({ ...req.body, passwordHash }, req.user.id, req);
    return sendSuccess(res, { data: result, message: 'Admin created', status: 201 });
  } catch (err) { next(err); }
});

router.post('/:id/impersonate', authorize('super_admin'), async (req, res, next) => {
  try {
    const result = await adminUsersService.impersonateUser(req.params.id, req.user.id, req);
    return sendSuccess(res, { data: result, message: 'Impersonation token issued' });
  } catch (err) { next(err); }
});

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../../middleware/authenticate.js';
import { authorize } from '../../../middleware/authorize.js';
import { validateRequest } from '../../../middleware/validateRequest.js';
import { sendSuccess, sendPaginated } from '../../../utils/responseFormatter.js';
import * as tasksService from './tasks.service.js';
import { TASK_TEMPLATES } from './task-templates.js';

const router = Router();

const createTaskSchema = z.object({
  templateKey: z.string().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  assignedBooth: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().datetime().optional(),
  volunteerId: z.string().uuid().optional(),
});

const groupAssignSchema = z.object({
  volunteerIds: z.array(z.string().uuid()).min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  assignedBooth: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().datetime().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed']),
  completionNotes: z.string().optional(),
  completionPhotos: z.array(z.string().url()).optional(),
});

router.get('/templates', authenticate, authorize('candidate', 'admin', 'super_admin'), (req, res) => {
  return sendSuccess(res, { data: TASK_TEMPLATES });
});

// VMS-T-001
router.post('/', authenticate, authorize('candidate'), validateRequest(createTaskSchema), async (req, res, next) => {
  try {
    const task = await tasksService.createTask(req.user.id, req.body);
    return sendSuccess(res, { data: task, message: 'Task created', status: 201 });
  } catch (err) { next(err); }
});

// VMS-T-002/VMS-T-007-lite (group assignment; CSV bulk assignment can reuse this with a parsed list)
router.post('/group', authenticate, authorize('candidate'), validateRequest(groupAssignSchema), async (req, res, next) => {
  try {
    const { volunteerIds, ...taskFields } = req.body;
    const tasks = await tasksService.assignTaskToGroup(req.user.id, volunteerIds, taskFields);
    return sendSuccess(res, { data: tasks, message: `${tasks.length} tasks created`, status: 201 });
  } catch (err) { next(err); }
});

// VMS-T-003 (candidate + volunteer, API-CANDIDATE table)
router.get('/', authenticate, authorize('candidate', 'volunteer'), async (req, res, next) => {
  try {
    const { status, volunteerId, page, limit } = req.query;
    const result = await tasksService.listTasks(req.user.id, req.user.role, {
      status, volunteerId, page: page ? Number(page) : 1, limit: limit ? Number(limit) : 25,
    });
    return sendPaginated(res, result);
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, authorize('candidate', 'volunteer'), async (req, res, next) => {
  try {
    const task = await tasksService.getTask(req.user.id, req.user.role, req.params.id);
    return sendSuccess(res, { data: task });
  } catch (err) { next(err); }
});

// VMS-T-004
router.put('/:id', authenticate, authorize('candidate', 'volunteer'), validateRequest(updateStatusSchema), async (req, res, next) => {
  try {
    const task = await tasksService.updateTaskStatus(req.user.id, req.user.role, req.params.id, req.body);
    return sendSuccess(res, { data: task, message: 'Task updated' });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('candidate'), async (req, res, next) => {
  try {
    const result = await tasksService.deleteTask(req.user.id, req.params.id);
    return sendSuccess(res, { data: result, message: result.message });
  } catch (err) { next(err); }
});

// VMS-T-005: on-demand overdue check (a real deployment would cron this)
router.post('/check-overdue', authenticate, authorize('candidate'), async (req, res, next) => {
  try {
    const overdue = await tasksService.flagOverdueTasks(req.user.id);
    return sendSuccess(res, { data: overdue, message: `${overdue.length} overdue tasks flagged` });
  } catch (err) { next(err); }
});

export default router;

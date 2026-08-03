import { prisma } from '../../../config/db.js';
import { ApiError } from '../../../utils/responseFormatter.js';
import { getTemplate } from './task-templates.js';

// VMS-T-001/006: create from a template key or fully custom fields.
export async function createTask(candidateId, { templateKey, title, description, assignedBooth, priority, dueDate, volunteerId }) {
  const template = templateKey ? getTemplate(templateKey) : null;
  if (templateKey && !template) throw new ApiError(400, 'Unknown task template');

  if (volunteerId) {
    const volunteer = await prisma.volunteer.findFirst({ where: { id: volunteerId, candidateId } });
    if (!volunteer) throw new ApiError(404, 'Volunteer not found');
  }

  return prisma.task.create({
    data: {
      candidateId,
      volunteerId: volunteerId ?? null,
      title: title ?? template?.title,
      description: description ?? template?.description,
      assignedBooth,
      priority: priority ?? template?.priority ?? 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      status: 'pending',
    },
  });
}

// VMS-T-002: assign to a group — creates one task row per volunteer, all
// sharing the same title/description/deadline.
export async function assignTaskToGroup(candidateId, volunteerIds, taskFields) {
  const volunteers = await prisma.volunteer.findMany({ where: { id: { in: volunteerIds }, candidateId } });
  if (volunteers.length !== volunteerIds.length) throw new ApiError(400, 'One or more volunteers not found');

  return prisma.$transaction(
    volunteers.map((v) =>
      prisma.task.create({
        data: {
          candidateId,
          volunteerId: v.id,
          title: taskFields.title,
          description: taskFields.description,
          assignedBooth: taskFields.assignedBooth,
          priority: taskFields.priority ?? 'medium',
          dueDate: taskFields.dueDate ? new Date(taskFields.dueDate) : null,
          status: 'pending',
        },
      })
    )
  );
}

export async function listTasks(userId, role, { status, volunteerId, page = 1, limit = 25 } = {}) {
  // VMS-T-003: candidates see all their tasks; volunteers see only their own.
  const where = role === 'volunteer'
    ? { volunteer: { userId } }
    : { candidateId: userId, ...(volunteerId ? { volunteerId } : {}) };

  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.task.findMany({ where, orderBy: { dueDate: 'asc' }, skip: (page - 1) * limit, take: limit, include: { volunteer: true } }),
    prisma.task.count({ where }),
  ]);
  return { items, total, page, limit };
}

export async function getTask(userId, role, taskId) {
  const where = role === 'volunteer' ? { id: taskId, volunteer: { userId } } : { id: taskId, candidateId: userId };
  const task = await prisma.task.findFirst({ where, include: { volunteer: true } });
  if (!task) throw new ApiError(404, 'Task not found');
  return task;
}

// VMS-T-004: volunteers update their own task status + completion notes/photos.
export async function updateTaskStatus(userId, role, taskId, { status, completionNotes, completionPhotos }) {
  const task = await getTask(userId, role, taskId);
  return prisma.task.update({
    where: { id: task.id },
    data: { status, completionNotes, completionPhotos: completionPhotos ?? task.completionPhotos },
  });
}

export async function deleteTask(candidateId, taskId) {
  const task = await prisma.task.findFirst({ where: { id: taskId, candidateId } });
  if (!task) throw new ApiError(404, 'Task not found');
  await prisma.task.delete({ where: { id: taskId } });
  return { message: 'Task deleted' };
}

// VMS-T-005: flag + notify on overdue tasks — called by a periodic check
// (see jobs/ in the full build; invoked on-demand here for Part 3's scope).
export async function flagOverdueTasks(candidateId) {
  const overdue = await prisma.task.findMany({
    where: { candidateId, status: { not: 'completed' }, dueDate: { lt: new Date() } },
  });

  const { sendOverdueTaskAlert } = await import('../../notifications/notifications.service.js');
  await Promise.all(overdue.map((task) => sendOverdueTaskAlert(candidateId, task).catch(() => {})));

  return overdue;
}

// VMS-T-008: completion rate for volunteer performance metrics.
export async function getCompletionRate(volunteerId) {
  const [total, completed] = await Promise.all([
    prisma.task.count({ where: { volunteerId } }),
    prisma.task.count({ where: { volunteerId, status: 'completed' } }),
  ]);
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

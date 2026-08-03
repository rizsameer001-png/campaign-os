import { prisma } from '../../../config/db.js';
import { ApiError } from '../../../utils/responseFormatter.js';

const LOCK_AFTER_MS = 24 * 60 * 60 * 1000; // VMS-A-002

function todayDateOnly() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// VMS-A-001: mark today's attendance (upsert — one row per volunteer per day)
export async function markAttendance(volunteerUserId, { status, geolocation }) {
  const volunteer = await prisma.volunteer.findUnique({ where: { userId: volunteerUserId } });
  if (!volunteer) throw new ApiError(404, 'Volunteer profile not found for this user');

  const date = todayDateOnly();
  const existing = await prisma.attendance.findUnique({ where: { volunteerId_date: { volunteerId: volunteer.id, date } } });

  if (existing?.isLocked) {
    throw new ApiError(409, "Today's attendance is already locked and cannot be changed");
  }

  return prisma.attendance.upsert({
    where: { volunteerId_date: { volunteerId: volunteer.id, date } },
    update: { status, geolocation, checkIn: existing?.checkIn ?? new Date() },
    create: { volunteerId: volunteer.id, date, status, geolocation, checkIn: new Date() },
  });
}

// VMS-A-002: lock attendance rows older than 24h — call periodically (or
// lazily, as done here, whenever attendance is read for a given volunteer).
export async function lockStaleAttendance(volunteerId) {
  const cutoff = new Date(Date.now() - LOCK_AFTER_MS);
  await prisma.attendance.updateMany({
    where: { volunteerId, isLocked: false, createdAt: { lt: cutoff } },
    data: { isLocked: true },
  });
}

export async function listAttendance(volunteerId, { from, to } = {}) {
  await lockStaleAttendance(volunteerId);
  return prisma.attendance.findMany({
    where: {
      volunteerId,
      ...(from || to ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
    },
    orderBy: { date: 'desc' },
  });
}

// VMS-A-005: present/absent/late percentages
export async function getAttendanceSummary(volunteerId) {
  const records = await prisma.attendance.findMany({ where: { volunteerId } });
  const total = records.length;
  if (total === 0) return { present: 0, absent: 0, late: 0 };

  const count = (status) => records.filter((r) => r.status === status).length;
  return {
    present: Math.round((count('present') / total) * 100),
    absent: Math.round((count('absent') / total) * 100),
    late: Math.round((count('late') / total) * 100),
  };
}

// Candidate-facing: attendance across all their volunteers, for VMS-B-003-style overview
export async function getCandidateAttendanceOverview(candidateId, date = todayDateOnly()) {
  const volunteers = await prisma.volunteer.findMany({ where: { candidateId }, select: { id: true, name: true } });
  const records = await prisma.attendance.findMany({ where: { volunteerId: { in: volunteers.map((v) => v.id) }, date } });

  return volunteers.map((v) => ({
    volunteerId: v.id,
    name: v.name,
    status: records.find((r) => r.volunteerId === v.id)?.status ?? 'absent',
  }));
}

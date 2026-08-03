import { prisma } from '../../../config/db.js';
import { ApiError } from '../../../utils/responseFormatter.js';

// VMS-B-002: assign a volunteer to a booth (stored directly on Volunteer.assignedBooth)
export async function assignBooth(candidateId, volunteerId, boothId) {
  const volunteer = await prisma.volunteer.findFirst({ where: { id: volunteerId, candidateId } });
  if (!volunteer) throw new ApiError(404, 'Volunteer not found');
  return prisma.volunteer.update({ where: { id: volunteerId }, data: { assignedBooth: boothId } });
}

// VMS-B-004: check in/out with timestamp + geolocation
export async function checkIn(volunteerUserId, { boothId, geolocation }) {
  const volunteer = await prisma.volunteer.findUnique({ where: { userId: volunteerUserId } });
  if (!volunteer) throw new ApiError(404, 'Volunteer profile not found for this user');

  return prisma.boothReport.create({
    data: { volunteerId: volunteer.id, boothId, geolocation, issuesReported: null, photos: [] },
  });
}

// VMS-B-003: coverage map — Green (checked in today), Yellow (checked in >24h
// ago), Red (never / no volunteer assigned).
export async function getBoothCoverageMap(candidateId) {
  const volunteers = await prisma.volunteer.findMany({
    where: { candidateId, assignedBooth: { not: null } },
    select: { id: true, assignedBooth: true, name: true },
  });

  const boothIds = [...new Set(volunteers.map((v) => v.assignedBooth))];
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const boothStatuses = await Promise.all(
    boothIds.map(async (boothId) => {
      const volunteersAtBooth = volunteers.filter((v) => v.assignedBooth === boothId);
      const lastReport = await prisma.boothReport.findFirst({
        where: { boothId, volunteerId: { in: volunteersAtBooth.map((v) => v.id) } },
        orderBy: { createdAt: 'desc' },
      });

      let status = 'red';
      if (lastReport) status = lastReport.createdAt >= oneDayAgo ? 'green' : 'yellow';

      return {
        boothId,
        volunteerCount: volunteersAtBooth.length,
        lastCheckIn: lastReport?.createdAt ?? null,
        status,
      };
    })
  );

  return boothStatuses;
}

// LCC-M-003: Booth Coverage % = booths with >=1 check-in / total assigned booths
export async function computeBoothCoveragePercent(candidateId) {
  const coverage = await getBoothCoverageMap(candidateId);
  if (coverage.length === 0) return 0;
  const covered = coverage.filter((b) => b.status !== 'red').length;
  return Math.round((covered / coverage.length) * 100);
}

// VMS-B-004: submit a full booth report (turnout, issues, photos)
export async function submitBoothReport(volunteerUserId, { boothId, turnoutEstimate, issuesReported, photos, geolocation }) {
  const volunteer = await prisma.volunteer.findUnique({ where: { userId: volunteerUserId } });
  if (!volunteer) throw new ApiError(404, 'Volunteer profile not found for this user');

  // LCC-D-005: flag duplicate submissions from the same volunteer/booth within 1 hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentDuplicate = await prisma.boothReport.findFirst({
    where: { volunteerId: volunteer.id, boothId, createdAt: { gte: oneHourAgo } },
  });
  if (recentDuplicate) {
    throw new ApiError(409, 'A report for this booth was already submitted in the last hour');
  }

  return prisma.boothReport.create({
    data: { volunteerId: volunteer.id, boothId, turnoutEstimate, issuesReported, photos: photos ?? [], geolocation },
  });
}

// VMS-B-006: flag critical (swing/high-voter) booths for priority assignment
export async function flagCriticalBooths(candidateId, boothIds) {
  await prisma.systemSetting.upsert({
    where: { key: `critical_booths:${candidateId}` },
    update: { value: boothIds },
    create: { key: `critical_booths:${candidateId}`, value: boothIds },
  });
  return { message: 'Critical booths updated', boothIds };
}

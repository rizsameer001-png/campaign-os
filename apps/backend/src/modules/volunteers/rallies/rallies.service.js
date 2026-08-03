import { prisma } from '../../../config/db.js';
import { ApiError } from '../../../utils/responseFormatter.js';

const MAX_PHOTOS = 5; // VMS-A-003

// API-CANDIDATE: POST /api/rallies/report (volunteer)
export async function submitRallyReport(volunteerUserId, { rallyName, location, crowdEstimate, photos, issuesFaced }) {
  const volunteer = await prisma.volunteer.findUnique({ where: { userId: volunteerUserId } });
  if (!volunteer) throw new ApiError(404, 'Volunteer profile not found for this user');

  if (photos && photos.length > MAX_PHOTOS) {
    throw new ApiError(400, `Maximum ${MAX_PHOTOS} photos per rally report`);
  }

  return prisma.rallyReport.create({
    data: {
      volunteerId: volunteer.id,
      candidateId: volunteer.candidateId,
      rallyName,
      location,
      crowdEstimate,
      photos: photos ?? [],
      issuesFaced,
    },
  });
}

export async function listRallyReports(candidateId, { page = 1, limit = 25 } = {}) {
  const where = { candidateId };
  const [items, total] = await Promise.all([
    prisma.rallyReport.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit, include: { volunteer: true } }),
    prisma.rallyReport.count({ where }),
  ]);
  return { items, total, page, limit };
}

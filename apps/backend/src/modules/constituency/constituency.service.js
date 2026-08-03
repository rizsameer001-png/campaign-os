import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/responseFormatter.js';
import { getCached, setCached, invalidate } from './constituency.cache.js';

// CI-D-002/003
export async function createConstituency(data) {
  const existing = await prisma.constituency.findUnique({
    where: { name_state: { name: data.name, state: data.state } },
  });
  if (existing) throw new ApiError(409, 'A constituency with this name and state already exists');
  return prisma.constituency.create({ data });
}

export async function updateConstituency(id, data) {
  const existing = await prisma.constituency.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'Constituency not found');

  const updated = await prisma.constituency.update({ where: { id }, data });
  await invalidate(existing.name, existing.state);
  return updated;
}

// AD-C-008: block delete if a campaign is actively linked (readiness inputs
// or campaign plans referencing this constituency by name/state).
export async function deleteConstituency(id) {
  const existing = await prisma.constituency.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'Constituency not found');

  const linkedPlans = await prisma.campaignPlan.count({
    where: { constituency: existing.name, state: existing.state, status: { in: ['draft', 'active'] } },
  });
  if (linkedPlans > 0) {
    throw new ApiError(409, 'Cannot delete: active campaign plans reference this constituency');
  }

  await prisma.constituency.delete({ where: { id } });
  await invalidate(existing.name, existing.state);
  return { message: 'Constituency deleted' };
}

// CI-V-001: autocomplete search, min 2 chars
export async function searchConstituencies({ query, state, electionType, minPopulation, maxPopulation, page = 1, limit = 20 }) {
  const where = {
    ...(query ? { name: { contains: query, mode: 'insensitive' } } : {}),
    ...(state ? { state } : {}),
    ...(minPopulation || maxPopulation
      ? { population: { ...(minPopulation ? { gte: minPopulation } : {}), ...(maxPopulation ? { lte: maxPopulation } : {}) } }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.constituency.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.constituency.count({ where }),
  ]);

  return { items, total, page, limit };
}

// CI-D-007: cache-through single-constituency lookup
export async function getConstituency(name, state) {
  const cached = await getCached(name, state);
  if (cached) return cached;

  const constituency = await prisma.constituency.findUnique({ where: { name_state: { name, state } } });
  if (!constituency) throw new ApiError(404, 'Constituency not found');

  await setCached(name, state, constituency);
  return constituency;
}

// CI-V-004: compare up to 3 constituencies side by side
export async function compareConstituencies(ids) {
  if (ids.length > 3) throw new ApiError(400, 'Can compare at most 3 constituencies');
  return prisma.constituency.findMany({ where: { id: { in: ids } } });
}

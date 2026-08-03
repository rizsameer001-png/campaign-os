import crypto from 'node:crypto';
import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/responseFormatter.js';
import { generateCompletion, safeParseJson } from '../ai-tools/llm-client.js';
import { recordAiUsage } from '../ai-tools/usage-tracker.js';
import { allocateBudget, allocateWeeklyBudget } from './budget-allocator.js';

// ACP-G-001..008
export async function generatePlan(userId, { title, budget, electionType, state, constituency, daysUntilElection, targetVoterSegment }) {
  const weekCount = Math.max(1, Math.ceil(daysUntilElection / 7));

  const constituencyRow = await prisma.constituency.findUnique({
    where: { name_state: { name: constituency, state } },
  }).catch(() => null);

  const systemPrompt = `You are an Indian election campaign strategist. Return ONLY valid JSON: { "weeks": [{ "weekNumber": number, "theme": string, "digitalActions": string[], "groundActions": string[], "milestones": string[] }] }. Produce exactly ${weekCount} weeks, building toward election day.`;
  const userPrompt = [
    `Election type: ${electionType}. Budget: Rs ${budget}. Days until election: ${daysUntilElection}.`,
    constituencyRow
      ? `Constituency: ${constituencyRow.name}, ${constituencyRow.state} - population ${constituencyRow.population}, urban ${constituencyRow.urbanPercent}%, literacy ${constituencyRow.literacyRate}%.`
      : `Constituency: ${constituency}, ${state} (no data on file).`,
    targetVoterSegment ? `Target voter segment: ${targetVoterSegment}.` : '',
  ].filter(Boolean).join('\n');

  const { text, inputTokens, outputTokens, isFallback } = await generateCompletion({ systemPrompt, userPrompt, maxTokens: 2000 });

  await recordAiUsage({ userId, toolType: 'campaign_plan', inputTokens, outputTokens, metadata: { isFallback } });

  const parsed = safeParseJson(text);
  const aiWeeks = parsed?.weeks ?? buildFallbackWeeks(weekCount);

  // ACP-G-003/004: attach per-week budget allocation and turn each action
  // into a trackable item with an id + status (ACP-M-001).
  const weeklyBudget = allocateWeeklyBudget(budget, weekCount);
  const weeks = aiWeeks.map((week, idx) => ({
    weekNumber: week.weekNumber ?? idx + 1,
    theme: week.theme ?? `Week ${idx + 1}`,
    budgetAllocation: weeklyBudget,
    items: [
      ...(week.digitalActions ?? []).map((title) => makeItem('digital', title)),
      ...(week.groundActions ?? []).map((title) => makeItem('ground', title)),
      ...(week.milestones ?? []).map((title) => makeItem('milestone', title)),
    ],
  }));

  const plan = await prisma.campaignPlan.create({
    data: {
      userId,
      title: title || `${electionType} campaign - ${constituency}`,
      budget: BigInt(budget),
      electionType,
      state,
      constituency,
      daysUntilElection,
      planData: { weeks, totalBudgetAllocation: allocateBudget(budget), targetVoterSegment: targetVoterSegment ?? null },
      status: 'draft',
      version: 1,
    },
  });

  return plan;
}

function makeItem(category, title) {
  return { id: crypto.randomUUID(), category, title, status: 'pending' };
}

function buildFallbackWeeks(weekCount) {
  return Array.from({ length: weekCount }, (_, i) => ({
    weekNumber: i + 1,
    theme: `Week ${i + 1} (AI unavailable - edit manually)`,
    digitalActions: ['Post campaign update on social media'],
    groundActions: ['Door-to-door outreach in key booths'],
    milestones: [],
  }));
}

// ACP-G-007: regenerate with modified inputs - creates a new version rather
// than mutating the existing plan, so history is preserved.
export async function regeneratePlan(userId, planId, updatedInputs) {
  const existing = await prisma.campaignPlan.findFirst({ where: { id: planId, userId } });
  if (!existing) throw new ApiError(404, 'Plan not found');

  const newPlan = await generatePlan(userId, {
    title: existing.title,
    budget: Number(existing.budget),
    electionType: existing.electionType,
    state: existing.state,
    constituency: existing.constituency,
    daysUntilElection: existing.daysUntilElection,
    ...updatedInputs,
  });

  return prisma.campaignPlan.update({
    where: { id: newPlan.id },
    data: { version: existing.version + 1 },
  });
}

export async function listPlans(userId) {
  return prisma.campaignPlan.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}

export async function getPlan(userId, planId) {
  const plan = await prisma.campaignPlan.findFirst({ where: { id: planId, userId } });
  if (!plan) throw new ApiError(404, 'Plan not found');
  return plan;
}

// ACP-M-001: toggle an item's status (pending/in_progress/completed).
export async function updateItemStatus(userId, planId, weekNumber, itemId, status) {
  const plan = await prisma.campaignPlan.findFirst({ where: { id: planId, userId } });
  if (!plan) throw new ApiError(404, 'Plan not found');

  const planData = plan.planData;
  const week = planData.weeks.find((w) => w.weekNumber === weekNumber);
  if (!week) throw new ApiError(404, 'Week not found in plan');

  const item = week.items.find((i) => i.id === itemId);
  if (!item) throw new ApiError(404, 'Item not found in week');

  item.status = status;

  return prisma.campaignPlan.update({ where: { id: planId }, data: { planData } });
}

// ACP-M-003: candidate adds a custom task to an AI-generated plan.
export async function addCustomItem(userId, planId, weekNumber, { category, title }) {
  const plan = await prisma.campaignPlan.findFirst({ where: { id: planId, userId } });
  if (!plan) throw new ApiError(404, 'Plan not found');

  const planData = plan.planData;
  const week = planData.weeks.find((w) => w.weekNumber === weekNumber);
  if (!week) throw new ApiError(404, 'Week not found in plan');

  week.items.push(makeItem(category, title));

  return prisma.campaignPlan.update({ where: { id: planId }, data: { planData } });
}

// ACP-M-002: overall completion percentage for dashboard KPIs.
export function computePlanProgress(plan) {
  const allItems = plan.planData.weeks.flatMap((w) => w.items);
  if (allItems.length === 0) return 0;
  const completed = allItems.filter((i) => i.status === 'completed').length;
  return Math.round((completed / allItems.length) * 100);
}

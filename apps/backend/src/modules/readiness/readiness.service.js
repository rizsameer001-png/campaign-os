import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/responseFormatter.js';
import { computePillarScores, computeOverallScore, deriveStrengthsWeaknesses, interpretScore } from './scoring.engine.js';
import { generateCompletion } from '../ai-tools/llm-client.js';
import { recordAiUsage } from '../ai-tools/usage-tracker.js';

const MAX_INPUT_VERSIONS = 10; // ERE-I-006

// ERE-I-001..008
export async function saveInput(userId, data) {
  const input = await prisma.readinessInput.create({
    data: {
      userId,
      state: data.state,
      constituency: data.constituency,
      electionType: data.electionType,
      budget: BigInt(data.budget),
      party: data.party,
      socialMediaScore: data.socialMediaScore,
      volunteerCount: data.volunteerCount,
      pastVictory: data.pastVictory,
      pastVictoryDetails: data.pastVictoryDetails,
      isDraft: data.isDraft ?? false,
      version: (await prisma.readinessInput.count({ where: { userId } })) + 1,
    },
  });

  await pruneOldVersions(userId);
  return input;
}

async function pruneOldVersions(userId) {
  const inputs = await prisma.readinessInput.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    skip: MAX_INPUT_VERSIONS,
    select: { id: true },
  });
  if (inputs.length > 0) {
    await prisma.readinessInput.deleteMany({ where: { id: { in: inputs.map((i) => i.id) } } });
  }
}

// ERE-I-003: autosave draft — upserts the candidate's single in-progress draft
// rather than creating a new versioned row each keystroke/interval.
export async function saveDraft(userId, data) {
  const existingDraft = await prisma.readinessInput.findFirst({
    where: { userId, isDraft: true },
    orderBy: { createdAt: 'desc' },
  });

  if (existingDraft) {
    return prisma.readinessInput.update({
      where: { id: existingDraft.id },
      data: { ...data, budget: BigInt(data.budget ?? 0) },
    });
  }

  return saveInput(userId, { ...data, isDraft: true });
}

// POST /api/readiness/calculate — ERE-S-001..006 + ERE-O-001..008
export async function calculateReadiness(userId, data) {
  const input = await saveInput(userId, { ...data, isDraft: false });

  const constituency = await prisma.constituency.findUnique({
    where: { name_state: { name: data.constituency, state: data.state } },
  }).catch(() => null);

  const pillarScores = computePillarScores(data, constituency);
  const overallScore = computeOverallScore(pillarScores);
  const { strengths, weaknesses } = deriveStrengthsWeaknesses(pillarScores);

  // ERE-O-003/ERE-S-005: AI-generated recommendations layered on top of the
  // deterministic scores, using weaknesses + constituency context.
  const recommendations = await generateRecommendations(userId, { weaknesses, constituency, data });

  const report = await prisma.readinessReport.create({
    data: {
      userId,
      inputId: input.id,
      overallScore,
      organizationScore: Math.round(pillarScores.organization),
      digitalScore: Math.round(pillarScores.digital),
      resourcesScore: Math.round(pillarScores.resources),
      voterScore: Math.round(pillarScores.voter),
      visibilityScore: Math.round(pillarScores.visibility),
      strengths,
      weaknesses,
      recommendations,
      aiAnalysisRaw: { pillarScores, constituencyFound: Boolean(constituency) },
    },
  });

  return { ...report, interpretation: interpretScore(overallScore) };
}

async function generateRecommendations(userId, { weaknesses, constituency, data }) {
  const systemPrompt = 'You are an Indian election campaign strategist. Given the weaknesses below, return ONLY a JSON array of 3 to 10 short, specific, actionable recommendation strings — no other text.';
  const userPrompt = [
    `Weaknesses: ${weaknesses.join('; ')}`,
    constituency
      ? `Constituency: ${constituency.name}, ${constituency.state} — population ${constituency.population}, literacy ${constituency.literacyRate}%, urban ${constituency.urbanPercent}%.`
      : `Constituency "${data.constituency}, ${data.state}" has no data on file yet.`,
    `Election type: ${data.electionType}. Budget: ₹${data.budget}.`,
  ].join('\n');

  const { text, inputTokens, outputTokens, isFallback } = await generateCompletion({ systemPrompt, userPrompt, maxTokens: 500 });

  await recordAiUsage({
    userId,
    toolType: 'readiness_analysis',
    inputTokens,
    outputTokens,
    metadata: { isFallback },
  });

  try {
    const parsed = JSON.parse(text.replace(/```json\s*|```\s*/g, '').trim());
    if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 10);
  } catch {
    // fall through to heuristic fallback below
  }

  return weaknesses.map((w) => `Address: ${w}`);
}

// ERE-O-006: "My Reports"
export async function listReports(userId) {
  return prisma.readinessReport.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { input: true },
  });
}

export async function getReport(userId, reportId) {
  const report = await prisma.readinessReport.findFirst({
    where: { id: reportId, userId },
    include: { input: true },
  });
  if (!report) throw new ApiError(404, 'Report not found');
  return { ...report, interpretation: interpretScore(report.overallScore) };
}

// ERE-O-005: public share link, 7-day expiry
export async function createShareLink(userId, reportId) {
  const report = await prisma.readinessReport.findFirst({ where: { id: reportId, userId } });
  if (!report) throw new ApiError(404, 'Report not found');

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.readinessReport.update({
    where: { id: reportId },
    data: { publicShareToken: token, publicShareExpiresAt: expiresAt },
  });

  return { token, expiresAt };
}

export async function getSharedReport(token) {
  const report = await prisma.readinessReport.findFirst({
    where: { publicShareToken: token, publicShareExpiresAt: { gt: new Date() } },
  });
  if (!report) throw new ApiError(404, 'Shared report not found or has expired');
  return { ...report, interpretation: interpretScore(report.overallScore) };
}

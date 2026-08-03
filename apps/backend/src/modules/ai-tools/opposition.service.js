import { prisma } from '../../config/db.js';
import { generateCompletion } from './llm-client.js';
import { recordAiUsage } from './usage-tracker.js';

/**
 * AIH-O-002 in the FRD describes scraping opponent social/news mentions.
 * That's intentionally NOT automated here: building a general-purpose
 * scraper raises real legal/ToS questions per opponent platform, and a
 * "track this named individual's public activity automatically" feature is
 * exactly the kind of thing worth a deliberate legal review before shipping,
 * not a default in an OSS-ish starter kit.
 *
 * Instead: the candidate (or their team) pastes in publicly available
 * statements/news excerpts they've already gathered, and the AI summarizes
 * and compares — same value (AIH-O-003/005), no scraping infrastructure.
 */
export async function analyzeOpposition(userId, { opponentName, publicStatements, ownPositions }) {
  const systemPrompt = 'You are a political analyst. Summarize the opponent\'s recent public statements/activity, then produce a brief comparison against the candidate\'s own stated positions. Be factual and neutral in tone — no speculation beyond what the provided text supports.';
  const userPrompt = [
    `Opponent: ${opponentName}`,
    `Publicly available statements/activity provided by the candidate's team:\n${publicStatements}`,
    ownPositions ? `Candidate's own positions for comparison:\n${ownPositions}` : '',
  ].filter(Boolean).join('\n\n');

  const { text, inputTokens, outputTokens, isFallback } = await generateCompletion({ systemPrompt, userPrompt, maxTokens: 1200 });

  const usageLog = await recordAiUsage({
    userId,
    toolType: 'opposition',
    inputTokens,
    outputTokens,
    metadata: { opponentName, isFallback, analysis: text },
  });

  return { id: usageLog.id, opponentName, analysis: text, generatedAt: usageLog.createdAt };
}

export async function getOppositionHistory(userId) {
  const logs = await prisma.aiUsageLog.findMany({
    where: { userId, toolType: 'opposition' },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return logs.map((l) => ({ id: l.id, ...l.metadata, createdAt: l.createdAt }));
}

import { prisma } from '../../config/db.js';
import { generateCompletion } from './llm-client.js';
import { recordAiUsage } from './usage-tracker.js';
import { ApiError } from '../../utils/responseFormatter.js';

const TONE_GUIDANCE = {
  Aggressive: 'confrontational, high-energy, calling out the status quo',
  Inspirational: 'uplifting, hopeful, focused on shared future',
  Factual: 'measured, data-driven, policy-focused',
};

// AIH-S-001/002
export async function generateSpeech(userId, { topic, audienceType, tone, language, duration }) {
  const systemPrompt = `You are a political speechwriting assistant for an Indian election campaign. Write in ${language}. Structure the speech with: a greeting, key points, a call-to-action, and a closing. Keep the tone ${TONE_GUIDANCE[tone] || tone}.`;
  const userPrompt = `Write a ${duration} speech on the topic "${topic}" for a ${audienceType} audience.`;

  const { text, inputTokens, outputTokens, isFallback } = await generateCompletion({ systemPrompt, userPrompt });

  const usageLog = await recordAiUsage({
    userId,
    toolType: 'speech',
    inputTokens,
    outputTokens,
    // Content is stored in metadata (JSONB) rather than a dedicated table —
    // keeps Part 2 schema-neutral; promote to `ai_generated_content` later
    // if full-text search across speeches becomes a real requirement.
    metadata: { topic, audienceType, tone, language, duration, isFallback, content: text },
  });

  return { id: usageLog.id, content: text, generatedAt: usageLog.createdAt };
}

// AIH-S-004: speeches aren't a separate table in Part 1's schema scope —
// stored as structured metadata alongside the usage log for now. If
// searchable speech history becomes a hard requirement, promote this to
// its own `ai_generated_content` table (id, userId, toolType, content, tags).
export async function getSpeechHistory(userId) {
  const logs = await prisma.aiUsageLog.findMany({
    where: { userId, toolType: 'speech' },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  if (logs.length === 0) throw new ApiError(404, 'No speech history yet');
  return logs.map((l) => ({ id: l.id, ...l.metadata, createdAt: l.createdAt }));
}

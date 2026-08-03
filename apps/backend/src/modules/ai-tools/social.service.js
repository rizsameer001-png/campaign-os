import { generateCompletion, safeParseJson } from './llm-client.js';
import { recordAiUsage } from './usage-tracker.js';
import { prisma } from '../../config/db.js';

// AIH-SM-006: platform character limits
const PLATFORM_LIMITS = {
  'Twitter/X': 280,
  Facebook: 63206,
  Instagram: 2200,
  WhatsApp: 65536,
};

// AIH-SM-001/002/003/004
export async function generateSocialPost(userId, { topic, platform, tone, language, variantCount = 2 }) {
  const limit = PLATFORM_LIMITS[platform] ?? 500;
  const systemPrompt = `You write ${platform} posts for an Indian political campaign in ${language}. Return ONLY valid JSON: { "variants": [{ "text": string, "hashtags": string[] }] }. Each "text" must be under ${limit} characters. Generate exactly ${variantCount} distinct variants for A/B testing.`;
  const userPrompt = `Topic: ${topic}. Tone: ${tone}.`;

  const { text, inputTokens, outputTokens, isFallback } = await generateCompletion({ systemPrompt, userPrompt, maxTokens: 800 });

  const parsed = safeParseJson(text);
  const variants = (parsed?.variants ?? [{ text: text.slice(0, limit), hashtags: [] }]).map((v) => ({
    ...v,
    text: v.text?.slice(0, limit) ?? '',
  }));

  const usageLog = await recordAiUsage({
    userId,
    toolType: 'social',
    inputTokens,
    outputTokens,
    metadata: { topic, platform, tone, language, isFallback, variants },
  });

  return { id: usageLog.id, platform, variants, generatedAt: usageLog.createdAt };
}

export async function getSocialHistory(userId) {
  const logs = await prisma.aiUsageLog.findMany({
    where: { userId, toolType: 'social' },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return logs.map((l) => ({ id: l.id, ...l.metadata, createdAt: l.createdAt }));
}

import { prisma } from '../../config/db.js';
import { generateCompletion, safeParseJson } from './llm-client.js';
import { recordAiUsage } from './usage-tracker.js';

const MANIFESTO_SECTIONS = ['Vision', 'Infrastructure', 'Education', 'Healthcare', 'Employment', 'Women Safety', 'Agriculture'];

// AIH-M-001/002/005
export async function generateManifesto(userId, { constituencyName, state, keyIssues, partyIdeology, targetDemographics }) {
  let constituencyContext = '';
  if (constituencyName && state) {
    const constituency = await prisma.constituency.findUnique({
      where: { name_state: { name: constituencyName, state } },
    });
    if (constituency) {
      constituencyContext = `Constituency context: population ${constituency.population}, literacy rate ${constituency.literacyRate}%, urban ${constituency.urbanPercent}%.`;
    }
  }

  const systemPrompt = `You are drafting an Indian election manifesto. Return ONLY valid JSON: { "sections": [{ "title": string, "content": string }] }. Cover exactly these sections in order: ${MANIFESTO_SECTIONS.join(', ')}.`;
  const userPrompt = [
    constituencyContext,
    `Key issues to address: ${keyIssues.join(', ')}.`,
    partyIdeology ? `Party ideology: ${partyIdeology}.` : '',
    targetDemographics ? `Target demographics: ${targetDemographics}.` : '',
  ].filter(Boolean).join('\n');

  const { text, inputTokens, outputTokens, isFallback } = await generateCompletion({ systemPrompt, userPrompt, maxTokens: 1500 });

  const parsed = safeParseJson(text);
  const sections = parsed?.sections ?? MANIFESTO_SECTIONS.map((title) => ({ title, content: '(AI unavailable — draft this section manually)' }));

  const usageLog = await recordAiUsage({
    userId,
    toolType: 'manifesto',
    inputTokens,
    outputTokens,
    metadata: { constituencyName, state, keyIssues, partyIdeology, targetDemographics, isFallback, sections },
  });

  return { id: usageLog.id, sections, generatedAt: usageLog.createdAt };
}

export async function getManifestoHistory(userId) {
  const logs = await prisma.aiUsageLog.findMany({
    where: { userId, toolType: 'manifesto' },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return logs.map((l) => ({ id: l.id, ...l.metadata, createdAt: l.createdAt }));
}

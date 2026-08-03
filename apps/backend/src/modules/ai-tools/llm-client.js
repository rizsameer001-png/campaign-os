import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { ApiError } from '../../utils/responseFormatter.js';

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';

function estimateTokens(text) {
  // Rough estimate (~4 chars/token for English) — good enough for the
  // fallback path; the real path uses the provider's reported usage.
  return Math.max(1, Math.ceil(text.length / 4));
}

/**
 * Generic completion call used by ai-tools/* and campaign-planner services.
 * Swappable provider: only this file touches the HTTP call, so switching
 * from OpenAI to another provider (Anthropic, a regional LLM, etc.) is a
 * single-file change.
 *
 * Falls back to a clearly-labeled stub response when OPENAI_API_KEY isn't
 * set, so the rest of the app (and this whole Part 2 delivery) is runnable
 * end-to-end without a real key during development.
 */
export async function generateCompletion({ systemPrompt, userPrompt, maxTokens = 900, temperature = 0.7 }) {
  if (!env.OPENAI_API_KEY) {
    logger.warn('OPENAI_API_KEY not configured — returning fallback stub AI response');
    const stub = buildFallbackText(userPrompt);
    return {
      text: stub,
      inputTokens: estimateTokens(systemPrompt + userPrompt),
      outputTokens: estimateTokens(stub),
      isFallback: true,
    };
  }

  const response = await fetch(OPENAI_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    logger.error('AI provider request failed', { status: response.status, errBody });
    throw new ApiError(502, 'AI provider request failed. Please try again.');
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? '';

  return {
    text,
    inputTokens: data.usage?.prompt_tokens ?? estimateTokens(systemPrompt + userPrompt),
    outputTokens: data.usage?.completion_tokens ?? estimateTokens(text),
    isFallback: false,
  };
}

function buildFallbackText(userPrompt) {
  return [
    '[AI provider not configured — this is a placeholder response.]',
    'Set OPENAI_API_KEY in apps/backend/.env to generate real content.',
    '',
    'Your request was:',
    userPrompt.slice(0, 300),
  ].join('\n');
}

/** Attempts to parse JSON out of a model response, tolerating markdown code fences. */
export function safeParseJson(text) {
  const cleaned = text.replace(/```json\s*|```\s*/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

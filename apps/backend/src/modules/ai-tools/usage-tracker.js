import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';

/**
 * AIH-U-001: every AI request is logged with user, tool type, tokens, cost,
 * timestamp, status. Called by every ai-tools/* and campaign-planner service
 * right after (or instead of, on error) calling generateCompletion.
 */
export async function recordAiUsage({ userId, toolType, inputTokens, outputTokens, status = 'success', errorMessage, metadata }) {
  const costInr =
    (inputTokens / 1000) * env.AI_COST_PER_1K_INPUT_TOKENS_INR +
    (outputTokens / 1000) * env.AI_COST_PER_1K_OUTPUT_TOKENS_INR;

  return prisma.aiUsageLog.create({
    data: {
      userId,
      toolType,
      inputTokens,
      outputTokens,
      costInr,
      status,
      errorMessage: errorMessage ?? null,
      metadata: metadata ?? undefined,
    },
  });
}

/** AD-AI-002 style aggregate — also used by the candidate-facing usage page. */
export async function getUsageSummary(userId, { from, to } = {}) {
  const where = {
    userId,
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
  };

  const logs = await prisma.aiUsageLog.findMany({ where });
  const totalCostInr = logs.reduce((sum, l) => sum + l.costInr, 0);
  const totalRequests = logs.length;
  const byTool = logs.reduce((acc, l) => {
    acc[l.toolType] = (acc[l.toolType] ?? 0) + 1;
    return acc;
  }, {});

  return { totalCostInr, totalRequests, byTool };
}

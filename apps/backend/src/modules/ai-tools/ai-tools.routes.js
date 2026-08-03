import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { enforceAiQuota, getQuotaStatus } from './quota.middleware.js';
import { sendSuccess } from '../../utils/responseFormatter.js';
import { getUsageSummary } from './usage-tracker.js';

import * as speechService from './speech.service.js';
import * as manifestoService from './manifesto.service.js';
import * as oppositionService from './opposition.service.js';
import * as socialService from './social.service.js';

const router = Router();

// Every AI tool is candidate-only; the quota check is applied per-route
// below (not globally) so history/usage reads still work even once a
// candidate has hit their monthly quota — only new generation is blocked.
router.use(authenticate, authorize('candidate'));

// --- Speech (AIH-S-001..006) ---
const speechSchema = z.object({
  topic: z.string().min(1),
  audienceType: z.enum(['Rally', 'Door-to-door', 'Press']),
  tone: z.enum(['Aggressive', 'Inspirational', 'Factual']),
  language: z.enum(['Hindi', 'English', 'Regional']),
  duration: z.enum(['short', 'medium', 'long']),
});

router.post('/speech', enforceAiQuota, validateRequest(speechSchema), async (req, res, next) => {
  try {
    const result = await speechService.generateSpeech(req.user.id, req.body);
    return sendSuccess(res, { data: { ...result, quotaWarning: req.aiQuota.warning }, message: 'Speech generated' });
  } catch (err) { next(err); }
});

router.get('/speech/history', async (req, res, next) => {
  try {
    return sendSuccess(res, { data: await speechService.getSpeechHistory(req.user.id) });
  } catch (err) { next(err); }
});

// --- Manifesto (AIH-M-001..005) ---
const manifestoSchema = z.object({
  constituencyName: z.string().optional(),
  state: z.string().optional(),
  keyIssues: z.array(z.string()).min(1),
  partyIdeology: z.string().optional(),
  targetDemographics: z.string().optional(),
});

router.post('/manifesto', enforceAiQuota, validateRequest(manifestoSchema), async (req, res, next) => {
  try {
    const result = await manifestoService.generateManifesto(req.user.id, req.body);
    return sendSuccess(res, { data: { ...result, quotaWarning: req.aiQuota.warning }, message: 'Manifesto generated' });
  } catch (err) { next(err); }
});

router.get('/manifesto/history', async (req, res, next) => {
  try {
    return sendSuccess(res, { data: await manifestoService.getManifestoHistory(req.user.id) });
  } catch (err) { next(err); }
});

// --- Opposition (AIH-O-001..005) ---
const oppositionSchema = z.object({
  opponentName: z.string().min(1),
  publicStatements: z.string().min(1, 'Paste in publicly available statements or news excerpts to analyze'),
  ownPositions: z.string().optional(),
});

router.post('/opposition', enforceAiQuota, validateRequest(oppositionSchema), async (req, res, next) => {
  try {
    const result = await oppositionService.analyzeOpposition(req.user.id, req.body);
    return sendSuccess(res, { data: { ...result, quotaWarning: req.aiQuota.warning }, message: 'Analysis generated' });
  } catch (err) { next(err); }
});

router.get('/opposition/history', async (req, res, next) => {
  try {
    return sendSuccess(res, { data: await oppositionService.getOppositionHistory(req.user.id) });
  } catch (err) { next(err); }
});

// --- Social (AIH-SM-001..006) ---
const socialSchema = z.object({
  topic: z.string().min(1),
  platform: z.enum(['Twitter/X', 'Facebook', 'Instagram', 'WhatsApp']),
  tone: z.string().min(1),
  language: z.enum(['Hindi', 'English', 'Hinglish']),
  variantCount: z.number().int().min(1).max(5).optional(),
});

router.post('/social', enforceAiQuota, validateRequest(socialSchema), async (req, res, next) => {
  try {
    const result = await socialService.generateSocialPost(req.user.id, req.body);
    return sendSuccess(res, { data: { ...result, quotaWarning: req.aiQuota.warning }, message: 'Posts generated' });
  } catch (err) { next(err); }
});

router.get('/social/history', async (req, res, next) => {
  try {
    return sendSuccess(res, { data: await socialService.getSocialHistory(req.user.id) });
  } catch (err) { next(err); }
});

// --- Usage (AIH-U-*, API-CANDIDATE GET /api/ai/usage) ---
router.get('/usage', async (req, res, next) => {
  try {
    const summary = await getUsageSummary(req.user.id);
    const quota = await getQuotaStatus(req.user.id);
    return sendSuccess(res, { data: { ...summary, quota } });
  } catch (err) { next(err); }
});

export default router;

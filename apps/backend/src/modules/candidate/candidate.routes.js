import { Router } from 'express';
import { z } from 'zod';
import * as candidateService from './candidate.service.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { sendSuccess } from '../../utils/responseFormatter.js';

const router = Router();

const updateProfileSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  bio: z.string().max(2000).optional(),
  socialLinks: z.record(z.string().url()).optional(),
  profilePhotoUrl: z.string().url().optional(),
  profilePhotoId: z.string().optional(),
  constituencyName: z.string().optional(),
  party: z.string().optional(),
});

const emailChangeRequestSchema = z.object({ newEmail: z.string().email() });
const emailChangeConfirmSchema = z.object({ newEmail: z.string().email(), otp: z.string().length(6) });
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});
const publicProfileSchema = z.object({
  profileVisibility: z.boolean().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).min(3).max(60).optional(),
});

// CD-P-001..008 — all scoped to the authenticated candidate themself.
router.put('/me', authenticate, validateRequest(updateProfileSchema), async (req, res, next) => {
  try {
    const result = await candidateService.updateProfile(req.user.id, req.body);
    return sendSuccess(res, { data: result, message: 'Profile updated' });
  } catch (err) { next(err); }
});

router.post('/me/email/request-change', authenticate, validateRequest(emailChangeRequestSchema), async (req, res, next) => {
  try {
    const result = await candidateService.requestEmailChange(req.user.id, req.body.newEmail);
    return sendSuccess(res, { data: result, message: result.message });
  } catch (err) { next(err); }
});

router.post('/me/email/confirm-change', authenticate, validateRequest(emailChangeConfirmSchema), async (req, res, next) => {
  try {
    const result = await candidateService.confirmEmailChange(req.user.id, req.body.newEmail, req.body.otp);
    return sendSuccess(res, { data: result, message: 'Email updated' });
  } catch (err) { next(err); }
});

router.post('/me/password', authenticate, validateRequest(changePasswordSchema), async (req, res, next) => {
  try {
    const result = await candidateService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    return sendSuccess(res, { data: result, message: result.message });
  } catch (err) { next(err); }
});

router.get('/me/completion', authenticate, async (req, res, next) => {
  try {
    const result = await candidateService.getProfileCompletion(req.user.id);
    return sendSuccess(res, { data: result });
  } catch (err) { next(err); }
});

router.put('/me/public-profile', authenticate, validateRequest(publicProfileSchema), async (req, res, next) => {
  try {
    const result = await candidateService.updatePublicProfileSettings(req.user.id, req.body);
    return sendSuccess(res, { data: result, message: 'Public profile settings updated' });
  } catch (err) { next(err); }
});

router.delete('/me', authenticate, async (req, res, next) => {
  try {
    const result = await candidateService.requestAccountDeletion(req.user.id);
    return sendSuccess(res, { data: result, message: result.message });
  } catch (err) { next(err); }
});

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { sendSuccess } from '../../utils/responseFormatter.js';
import { createSignedUpload } from './media.service.js';

const router = Router();

const signRequestSchema = z.object({
  entityType: z.enum(['profile_photo', 'rally_photo', 'booth_report', 'manifesto_asset']),
});

// MED-001: POST /api/media/sign — frontend calls this, then uploads directly
// to Cloudinary using the returned signature (MED-002), never through our server.
router.post('/sign', authenticate, validateRequest(signRequestSchema), (req, res, next) => {
  try {
    const signature = createSignedUpload(req.user.id, req.body.entityType);
    return sendSuccess(res, { data: signature });
  } catch (err) {
    next(err);
  }
});

export default router;

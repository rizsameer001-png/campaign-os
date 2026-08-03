import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authLimiter } from '../../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  adminLoginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validation.js';

const router = Router();

// --- Public ---
router.post('/register', authLimiter, validateRequest(registerSchema), authController.register);
router.post('/login', authLimiter, validateRequest(loginSchema), authController.login);
router.post('/admin/login', authLimiter, validateRequest(adminLoginSchema), authController.adminLogin);
router.post('/refresh', authController.refresh);
router.post('/verify-otp', authLimiter, validateRequest(verifyOtpSchema), authController.verifyOtp);
router.post('/resend-otp', authLimiter, validateRequest(resendOtpSchema), authController.resendOtp);
router.post('/forgot-password', authLimiter, validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validateRequest(resetPasswordSchema), authController.resetPassword);

// --- Authenticated ---
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.get('/sessions', authenticate, authController.listSessions);
router.delete('/sessions/:id', authenticate, authController.revokeSession);

export default router;

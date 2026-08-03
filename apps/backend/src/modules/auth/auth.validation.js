import { z } from 'zod';

// AUTH-C-004: min 8 chars, 1 upper, 1 lower, 1 number, 1 special char
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// AUTH-C-001: candidate registration fields
export const registerSchema = z
  .object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Enter a valid phone number'),
    password: passwordSchema,
    confirmPassword: z.string(),
    state: z.string().min(1),
    constituency: z.string().min(1),
    party: z.string().optional().default('Independent'),
    acceptedTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the Terms of Service and Privacy Policy' }),
    }),
    recaptchaToken: z.string().min(1, 'reCAPTCHA verification is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// AUTH-CL-001
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

// AUTH-A-001/003: admin login + TOTP code
export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totpCode: z.string().length(6, 'Enter the 6-digit authenticator code').optional(),
});

// AUTH-C-003
export const verifyOtpSchema = z.object({
  userId: z.string().uuid(),
  otp: z.string().length(6),
});

export const resendOtpSchema = z.object({
  userId: z.string().uuid(),
});

// AUTH-CL-007
export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const refreshTokenSchema = z.object({
  // Read from httpOnly cookie in practice; schema kept for body-based fallback/testing.
  refreshToken: z.string().optional(),
});

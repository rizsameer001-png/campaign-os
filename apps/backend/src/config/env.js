import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),

  JWT_PRIVATE_KEY_BASE64: z.string().min(1, 'JWT_PRIVATE_KEY_BASE64 is required'),
  JWT_PUBLIC_KEY_BASE64: z.string().min(1, 'JWT_PUBLIC_KEY_BASE64 is required'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),

  REDIS_URL: z.string().optional(),

  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM: z.string().optional().default('Election Campaign OS <no-reply@example.com>'),

  SMS_GATEWAY_API_KEY: z.string().optional().default(''),
  SMS_GATEWAY_SENDER_ID: z.string().optional().default(''),

  RECAPTCHA_SECRET_KEY: z.string().optional().default(''),

  // --- AI provider (ai-tools, campaign-planner, readiness recommendations) ---
  OPENAI_API_KEY: z.string().optional().default(''),
  AI_MODEL: z.string().default('gpt-4o-mini'),
  // AIH-U-001: cost tracked per request, in INR, from provider's per-1K-token pricing.
  AI_COST_PER_1K_INPUT_TOKENS_INR: z.coerce.number().default(0.15),
  AI_COST_PER_1K_OUTPUT_TOKENS_INR: z.coerce.number().default(0.60),
  // AIH-U-002/003: monthly quota per candidate, in INR spend, before blocking.
  AI_MONTHLY_QUOTA_INR: z.coerce.number().default(500),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());

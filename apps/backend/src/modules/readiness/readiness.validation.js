import { z } from 'zod';

export const readinessInputSchema = z.object({
  state: z.string().min(1),
  constituency: z.string().min(1),
  electionType: z.enum(['assembly', 'general', 'local']),
  budget: z.number().int().nonnegative(), // ERE-I-007: INR, formatted on the frontend
  party: z.string().optional().default('Independent'),
  socialMediaScore: z.number().int().min(1).max(10),
  volunteerCount: z.number().int().nonnegative(),
  pastVictory: z.boolean(),
  pastVictoryDetails: z.string().optional(),
  isDraft: z.boolean().optional().default(false), // ERE-I-003
});

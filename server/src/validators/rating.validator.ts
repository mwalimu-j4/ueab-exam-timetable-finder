import { z } from 'zod';

export const ratingSchema = z.object({
  stars: z.number().int().min(1, 'Stars must be at least 1').max(5, 'Stars must be at most 5'),
  comment: z.string().max(300, 'Comment must be 300 characters or less').optional(),
  clientId: z.string().min(1, 'Client ID is required'),
  userAgentType: z.string().optional(),
});

export const ratingSummaryQuerySchema = z.object({
  days: z.enum(['7', '30', '90']).optional(),
});

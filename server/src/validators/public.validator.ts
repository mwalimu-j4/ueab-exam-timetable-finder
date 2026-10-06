import { z } from 'zod';

export const searchExamsSchema = z.object({
  q: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  building: z.string().optional(),
  session: z.string().optional(),
});

export const visitSchema = z.object({
  visitorId: z.string().min(1, 'Visitor ID is required'),
});

export const eventSchema = z.object({
  type: z.enum(['SEARCH', 'DOWNLOAD_PDF', 'DOWNLOAD_ICS', 'ADD_COURSE']),
  query: z.string().optional(),
});

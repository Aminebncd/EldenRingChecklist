import { z } from 'zod';

export const progressBulkSchema = z.object({
  updates: z.array(z.object({
    slug: z.string(),
    status: z.enum(['unchecked', 'checked', 'skipped']),
    note: z.string().optional(),
  })),
});

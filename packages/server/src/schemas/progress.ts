import { z } from 'zod';

export const bulkProgressSchema = z.object({
  updates: z
    .array(
      z.object({
        slug: z.string().min(1),
        status: z.enum(['unchecked', 'checked', 'skipped']),
        note: z.string().optional()
      })
    )
    .min(1)
});

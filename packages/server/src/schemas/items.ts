import { z } from 'zod';

export const itemsQuerySchema = z.object({
  category: z.string().optional(),
  region: z.string().optional(),
  q: z.string().optional(),
});

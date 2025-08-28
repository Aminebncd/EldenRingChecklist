import { z } from 'zod';

export const itemsQuerySchema = z.object({
  category: z.string().optional(),
  region: z.string().optional(),
  q: z.string().optional(),
});

export const bulkUpsertSchema = z
  .array(
    z.object({
      title: z.string().min(1),
      category: z.string().optional(),
      subcategory: z.string().optional(),
      region: z.string().optional(),
      tags: z.array(z.string()).optional(),
      prerequisites: z.array(z.string()).optional(),
      weight: z.number().positive().optional(),
      isUnique: z.boolean().optional(),
      mapRef: z
        .object({
          lat: z.number().optional(),
          lng: z.number().optional(),
          note: z.string().optional(),
        })
        .partial()
        .optional(),
      notes: z.string().optional(),
    })
  )
  .min(1);

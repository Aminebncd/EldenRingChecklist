import { z } from 'zod';

const email = z.string().regex(/.+@.+/);

export const registerSchema = z.object({
  email,
  password: z.string().min(6),
  displayName: z.string().optional(),
});

export const loginSchema = z.object({
  email,
  password: z.string(),
});

import { z } from "zod";

export const salvarRascunhoSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      p: z.number().min(0),
      ea: z.number().min(0),
      ei: z.number().min(0).optional(),
      version: z.number().int().positive(),
    }),
  ),
});

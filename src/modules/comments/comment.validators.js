import { z } from "zod";

export const commentBodySchema = z.object({
  body: z.string().trim().min(1, "Comment text is required").max(5000, "Comment text is too long")
});

export const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().trim().optional()
});
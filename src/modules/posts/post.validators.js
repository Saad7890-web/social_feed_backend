import { z } from "zod";

export const createPostSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Post text is required")
    .max(5000, "Post text is too long"),
  imageKey: z
    .string()
    .trim()
    .max(500, "Invalid image reference")
    .optional()
    .nullable(),
  visibility: z.enum(["public", "private"]).default("public")
});

export const updatePostSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Post text is required")
    .max(5000, "Post text is too long")
    .optional(),
  imageKey: z
    .string()
    .trim()
    .max(500, "Invalid image reference")
    .optional()
    .nullable(),
  visibility: z.enum(["public", "private"]).optional()
});

export const feedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursorCreatedAt: z.string().datetime().optional(),
  cursorId: z.coerce.number().int().positive().optional()
});
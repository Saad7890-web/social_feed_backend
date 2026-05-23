import { z } from "zod";

const imageSchema = z
  .object({
    publicId: z.string().trim().min(1),
    version: z.coerce.number().int().nonnegative(),
    signature: z.string().trim().min(1),
    format: z.string().trim().max(20).optional().nullable(),
    width: z.coerce.number().int().positive().optional().nullable(),
    height: z.coerce.number().int().positive().optional().nullable(),
    bytes: z.coerce.number().int().positive().optional().nullable(),
    deliveryType: z.enum(["upload", "authenticated"])
  })
  .optional()
  .nullable();

export const createPostSchema = z.object({
  body: z.string().trim().min(1, "Post text is required").max(5000, "Post text is too long"),
  visibility: z.enum(["public", "private"]).default("public"),
  image: imageSchema
});

export const updatePostSchema = z.object({
  body: z.string().trim().min(1, "Post text is required").max(5000, "Post text is too long").optional(),
  visibility: z.enum(["public", "private"]).optional(),
  image: imageSchema
});

export const feedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursorCreatedAt: z.string().datetime().optional(),
  cursorId: z.coerce.number().int().positive().optional()
});
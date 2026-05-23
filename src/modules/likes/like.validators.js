import { z } from "zod";

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive("Invalid id")
});

export const summaryQuerySchema = z.object({
  previewLimit: z.coerce.number().int().min(1).max(10).default(3)
});
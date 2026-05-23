import { z } from "zod";

const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const createUploadSignatureSchema = z.object({
  fileName: z.string().trim().min(1, "File name is required").max(255, "File name is too long"),
  contentType: z.enum(allowedTypes, {
    errorMap: () => ({ message: "Only JPG, PNG, WEBP, or GIF images are allowed" })
  }),
  size: z.coerce.number().int().positive("File size must be greater than 0"),
  visibility: z.enum(["public", "private"]).default("public")
});

export const verifyCloudinaryImageSchema = z.object({
  publicId: z.string().trim().min(1, "Missing publicId"),
  version: z.coerce.number().int().nonnegative(),
  signature: z.string().trim().min(1, "Missing signature"),
  format: z.string().trim().max(20).optional().nullable(),
  width: z.coerce.number().int().positive().optional().nullable(),
  height: z.coerce.number().int().positive().optional().nullable(),
  bytes: z.coerce.number().int().positive().optional().nullable(),
  deliveryType: z.enum(["upload", "authenticated"]).default("upload")
});
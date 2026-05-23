import { z } from "zod";

const allowedContentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
];

export const createUploadSchema = z.object({
  fileName: z.string().trim().min(1, "File name is required").max(255, "File name is too long"),
  contentType: z.enum(allowedContentTypes, {
    errorMap: () => ({ message: "Only JPG, PNG, WEBP, or GIF images are allowed" })
  }),
  size: z.coerce.number().int().positive("File size must be greater than 0")
});
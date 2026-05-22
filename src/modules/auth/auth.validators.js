import { z } from "zod";

const nameSchema = z
  .string()
  .trim()
  .min(1, "This field is required")
  .max(100, "Must be at most 100 characters");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");

export const registerSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: z.string().trim().email("Enter a valid email address").toLowerCase(),
  password: passwordSchema
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").toLowerCase(),
  password: z.string().min(1, "Password is required")
});
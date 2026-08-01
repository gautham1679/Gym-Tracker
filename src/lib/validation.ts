import { z } from "zod";

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Enter a valid email address");

export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters");

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const categorySchema = z
  .string()
  .min(1, "Pick a category for this workout");

export const exerciseNameSchema = z
  .string()
  .trim()
  .min(1, "Exercise name is required")
  .max(80, "Exercise name is too long");

/**
 * A single set. Weight is REQUIRED (per product requirement) — not optional,
 * not nullable, must be a finite number >= 0. Reps must be a positive integer.
 */
export const setInputSchema = z.object({
  reps: z
    .number({ invalid_type_error: "Reps is required" })
    .int("Reps must be a whole number")
    .min(1, "Reps must be at least 1")
    .max(1000, "That's not a realistic rep count"),
  weight_kg: z
    .number({ invalid_type_error: "Weight is required" })
    .min(0, "Weight can't be negative")
    .max(1000, "That's not a realistic weight"),
});

export type SetInput = z.infer<typeof setInputSchema>;

/** Parses a text input into a number, returning null if it's empty/invalid. */
export function parseNumericInput(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

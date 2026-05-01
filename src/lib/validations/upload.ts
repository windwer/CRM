import { z } from "zod";

export const uploadCVSchema = z.union([
  z.object({
    candidateId: z.string().uuid().optional(),
  }).transform((data) => data),
  z.object({
    candidate_id: z.string().uuid().optional(),
  }).transform((data) => ({
    candidateId: data.candidate_id,
  })),
]);

export const CV_MAX_SIZE = 5 * 1024 * 1024;
export const CV_ALLOWED_TYPES = ["application/pdf"] as const;

export function validateCVFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!CV_ALLOWED_TYPES.includes(file.type as (typeof CV_ALLOWED_TYPES)[number])) {
    return { valid: false, error: "Solo se permiten archivos PDF" };
  }

  if (file.size > CV_MAX_SIZE) {
    return { valid: false, error: "El archivo supera el límite de 5 MB" };
  }

  return { valid: true };
}

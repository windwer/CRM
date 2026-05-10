import { z } from "zod";

const LOCKED_POSITIONS = [1, 8, 9, 10] as const;

export const addStageSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(50, "Máximo 50 caracteres"),
  position: z
    .number()
    .int()
    .min(2, "La posición mínima es 2")
    .max(7, "La posición máxima es 7")
    .refine(
      (p) => !(LOCKED_POSITIONS as readonly number[]).includes(p),
      "Las posiciones 1, 8, 9 y 10 están reservadas"
    ),
});

export const updateStageSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  position: z
    .number()
    .int()
    .min(2)
    .max(7)
    .refine(
      (p) => !(LOCKED_POSITIONS as readonly number[]).includes(p),
      "Las posiciones 1, 8, 9 y 10 están reservadas"
    )
    .optional(),
});

export const pipelineRenameSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100, "Máximo 100 caracteres"),
});

export { LOCKED_POSITIONS };

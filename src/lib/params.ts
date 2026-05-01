import { z } from "zod";

const uuidSchema = z.string().uuid();

export function validateId(id: string): {
  valid: boolean;
  response?: Response;
} {
  const result = uuidSchema.safeParse(id);

  if (!result.success) {
    return {
      valid: false,
      response: Response.json(
        {
          success: false,
          error: {
            code: "INVALID_ID",
            message: "El identificador proporcionado no es válido",
          },
        },
        { status: 400 }
      ),
    };
  }

  return { valid: true };
}

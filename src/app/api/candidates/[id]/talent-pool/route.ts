import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { talentPoolStatusSchema } from "@/lib/validations/candidate";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const parsed = talentPoolStatusSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message || "Estado inválido",
        400
      );
    }

    const existing = await db.candidate.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!existing) {
      throw new ApiError("NOT_FOUND", "Candidato no encontrado", 404);
    }

    const updated = await db.candidate.update({
      where: { id: params.id },
      data: { talentPoolStatus: parsed.data.talent_pool_status as any },
    });

    return apiResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

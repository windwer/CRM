import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { bulkTalentPoolSchema } from "@/lib/validations/candidate";

export async function PATCH(req: NextRequest) {
  try {
    const { errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const parsed = bulkTalentPoolSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message || "Datos inválidos",
        400
      );
    }

    const { candidate_ids, talent_pool_status } = parsed.data;

    const result = await db.$transaction(async (tx) => {
      const updated = await tx.candidate.updateMany({
        where: { id: { in: candidate_ids } },
        data: { talentPoolStatus: talent_pool_status as any },
      });
      return updated;
    });

    return apiResponse({ updated: result.count, talent_pool_status });
  } catch (error) {
    return handleApiError(error);
  }
}

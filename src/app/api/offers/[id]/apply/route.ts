import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { validateId } from "@/lib/params";
import logger from "@/lib/logger";
import { NextRequest } from "next/server";
import { applyOfferSchema } from "@/lib/validations/offer";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { valid, response } = validateId(params.id);
  if (!valid) return response!;

  try {
    const { session, errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

    const validation = applyOfferSchema.safeParse(await req.json());
    if (!validation.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        validation.error.issues[0]?.message ?? "Invalid request body",
        400
      );
    }
    const { candidateId } = validation.data;

    // Check if already applied
    const existing = await db.application.findFirst({
      where: {
        offerId: params.id,
        candidateId,
      },
    });

    if (existing) throw new ApiError("CONFLICT", "Candidate already applied to this offer", 409);

    const application = await db.application.create({
      data: {
        offerId: params.id,
        candidateId,
        status: "applied",
      },
    });

    logger.info("New application created", {
      applicationId: application.id,
      offerId: params.id,
      candidateId: candidateId,
      userId: session.user.id,
    });

    return apiResponse(application);
  } catch (error) {
    return handleApiError(error);
  }
}

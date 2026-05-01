import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { scoreCandidate } from "@/lib/ai/claudeService";
import logger from "@/lib/logger";
import { NextRequest } from "next/server";
import { scoreMatchSchema } from "@/lib/validations/ai";

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

    const validation = scoreMatchSchema.safeParse(await req.json());
    if (!validation.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        validation.error.issues[0]?.message ?? "Invalid request body",
        400
      );
    }
    const { candidateId, offerId, applicationId } = validation.data;

    // Call Claude to score
    const scoreResult = await scoreCandidate(candidateId, offerId, applicationId);

    logger.info("Candidate scored against offer", { candidateId, offerId, applicationId });

    return apiResponse(scoreResult);
  } catch (error) {
    return handleApiError(error);
  }
}

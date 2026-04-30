import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { scoreCandidate } from "@/lib/ai/claudeService";
import logger from "@/lib/logger";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);

    const { candidateId, offerId, applicationId } = await req.json();

    if (!candidateId || !offerId) {
      throw new ApiError("BAD_REQUEST", "candidateId and offerId are required", 400);
    }

    // Call Claude to score
    const scoreResult = await scoreCandidate(candidateId, offerId, applicationId);

    logger.info("Candidate scored against offer", { candidateId, offerId, applicationId });

    return apiResponse(scoreResult);
  } catch (error) {
    return handleApiError(error);
  }
}

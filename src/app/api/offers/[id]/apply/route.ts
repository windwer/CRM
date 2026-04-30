import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import logger from "@/lib/logger";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);

    const body = await req.json();
    const { candidateId } = body;

    if (!candidateId) throw new ApiError("BAD_REQUEST", "candidateId is required", 400);

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

import { auth } from "../../../../auth";
import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidate_id");
    const applicationId = searchParams.get("application_id");

    if (!candidateId && !applicationId) {
      throw new ApiError("BAD_REQUEST", "Either candidate_id or application_id is required", 400);
    }

    const where: any = {};
    if (applicationId) {
      where.applicationId = applicationId;
    } else if (candidateId) {
      where.application = {
        candidateId: candidateId
      };
    }

    const communications = await db.communication.findMany({
      where,
      orderBy: { sentAt: "desc" },
      include: {
        sender: {
          select: { name: true, email: true }
        }
      }
    });

    return apiResponse(communications);
  } catch (error) {
    return handleApiError(error);
  }
}

import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { parsePagination, buildMeta } from "@/lib/pagination";
import { NextRequest } from "next/server";
import type { Prisma } from "@smartcrm/database";

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = await requireRole("viewer");
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidate_id");
    const applicationId = searchParams.get("application_id");
    const { page, limit, skip, take } = parsePagination(searchParams);

    if (!candidateId && !applicationId) {
      throw new ApiError("BAD_REQUEST", "Either candidate_id or application_id is required", 400);
    }

    const where: Prisma.CommunicationWhereInput = {};
    if (applicationId) {
      where.applicationId = applicationId;
    } else if (candidateId) {
      where.application = {
        candidateId: candidateId
      };
    }

    const [communications, total] = await db.$transaction([
      db.communication.findMany({
        where,
        skip,
        take,
        orderBy: { sentAt: "desc" },
        include: {
          sender: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      db.communication.count({ where }),
    ]);

    return apiResponse(communications, buildMeta(total, page, limit));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST() {
  try {
    const { errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

    throw new ApiError("METHOD_NOT_ALLOWED", "Communication creation is not implemented", 405);
  } catch (error) {
    return handleApiError(error);
  }
}

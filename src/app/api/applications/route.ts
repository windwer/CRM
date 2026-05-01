import { db } from "@/lib/db";
import { Prisma, ApplicationStatus } from "@antigravity/database";
import { apiResponse, handleApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { parsePagination, buildMeta } from "@/lib/pagination";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = await requireRole("viewer");
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const offerId = searchParams.get("offer_id");
    const candidateId = searchParams.get("candidate_id");
    const status = searchParams.get("status");
    const { page, limit, skip, take } = parsePagination(searchParams);

    const where: Prisma.ApplicationWhereInput = {};
    if (offerId) where.offerId = offerId;
    if (candidateId) where.candidateId = candidateId;
    if (status) where.status = status as ApplicationStatus;

    const [applications, total] = await db.$transaction([
      db.application.findMany({
        where,
        include: {
          offer: { select: { title: true } },
          candidate: { select: { fullName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      db.application.count({ where }),
    ]);

    return apiResponse(applications, buildMeta(total, page, limit));
  } catch (error) {
    return handleApiError(error);
  }
}

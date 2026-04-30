import { auth } from "../../../../auth";
import { db } from "@/lib/db";
import { Prisma, ApplicationStatus } from "@antigravity/database";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const offerId = searchParams.get("offer_id");
    const candidateId = searchParams.get("candidate_id");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Prisma.ApplicationWhereInput = {};
    if (offerId) where.offerId = offerId;
    if (candidateId) where.candidateId = candidateId;
    if (status) where.status = status as ApplicationStatus;

    const [applications, total] = await Promise.all([
      db.application.findMany({
        where,
        include: {
          offer: { select: { title: true } },
          candidate: { select: { fullName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.application.count({ where }),
    ]);

    return apiResponse(applications, { total, page, limit });
  } catch (error) {
    return handleApiError(error);
  }
}

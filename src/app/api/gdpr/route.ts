import { db } from "@/lib/db";
import { apiResponse, handleApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { PAGINATION_DEFAULTS, buildMeta } from "@/lib/pagination";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = await requireRole("admin");
    if (errorResponse) return errorResponse;

    const where = { status: "pending" as const };
    const searchParams = new URL(req.url).searchParams;
    const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const requestedLimit =
      Number.parseInt(searchParams.get("limit") ?? String(PAGINATION_DEFAULTS.MAX_GDPR_BATCH), 10) ||
      PAGINATION_DEFAULTS.MAX_GDPR_BATCH;
    const limit = Math.min(
      Math.max(1, requestedLimit),
      PAGINATION_DEFAULTS.MAX_GDPR_BATCH
    );
    const skip = (page - 1) * limit;

    const [pending, total] = await db.$transaction([
      db.gDPRDeletionQueue.findMany({
        where,
        include: {
          candidate: {
            select: { fullName: true, email: true },
          },
        },
        orderBy: { deletionDate: "asc" },
        skip,
        take: limit,
      }),
      db.gDPRDeletionQueue.count({ where }),
    ]);

    return apiResponse(pending, buildMeta(total, page, limit));
  } catch (error) {
    return handleApiError(error);
  }
}

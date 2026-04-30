import { auth } from "../../../../auth";
import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { candidateSchema } from "@/lib/validations/candidate";
import { scheduleGDPRDeletion } from "@/lib/gdpr";
import logger from "@/lib/logger";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("archived") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where = includeArchived ? {} : { archivedAt: null };

    const [candidates, total] = await Promise.all([
      db.candidate.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.candidate.count({ where }),
    ]);

    return apiResponse(candidates, { total, page, limit });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);

    const body = await req.json();
    const validatedData = candidateSchema.parse(body);

    const candidate = await db.candidate.create({
      data: validatedData,
    });

    await scheduleGDPRDeletion(candidate.id);

    logger.info("Candidate created", { candidateId: candidate.id, userId: session.user.id });

    return apiResponse(candidate);
  } catch (error) {
    return handleApiError(error);
  }
}

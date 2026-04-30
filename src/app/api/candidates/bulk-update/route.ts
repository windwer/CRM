import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { apiResponse, ApiError, handleApiError } from "@/lib/errors";
import logger from "@/lib/logger";
import { NextRequest } from "next/server";
import { z } from "zod";

const bulkUpdateSchema = z.object({
  candidate_ids: z.array(z.string().uuid()).min(1),
  action: z.literal("archive"),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);
    }

    const body = bulkUpdateSchema.parse(await req.json());
    const result = await db.candidate.updateMany({
      where: {
        id: { in: body.candidate_ids },
        archivedAt: null,
      },
      data: {
        archivedAt: new Date(),
        archivedBy: session.user.id,
      },
    });

    logger.info("Candidates archived in bulk", {
      count: result.count,
      userId: session.user.id,
    });

    return apiResponse({ success: true, count: result.count });
  } catch (error) {
    return handleApiError(error);
  }
}

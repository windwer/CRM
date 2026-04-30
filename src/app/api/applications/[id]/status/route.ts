import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import logger from "@/lib/logger";
import { NextRequest } from "next/server";
import { z } from "zod";
import { ApplicationStatus } from "@antigravity/database";

const statusUpdateSchema = z.object({
  status: z.enum([
    "prospect",
    "applied",
    "screening",
    "interview_1",
    "interview_2",
    "interview_3",
    "offer",
    "hired",
    "rejected",
  ]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);

    const body = await req.json();
    const { status } = statusUpdateSchema.parse(body);

    const oldApp = await db.application.findUnique({
      where: { id: params.id },
      select: { status: true },
    });

    if (!oldApp) throw new ApiError("NOT_FOUND", "Application not found", 404);

    const application = await db.$transaction(async (tx) => {
      const updated = await tx.application.update({
        where: { id: params.id },
        data: { 
          status: status as ApplicationStatus,
          lastContactAt: new Date(),
          lastContactedBy: session.user.id,
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: params.id,
          changedBy: session.user.id!,
          oldStatus: oldApp.status,
          newStatus: status as ApplicationStatus,
        },
      });

      return updated;
    });

    logger.info("Application status updated", {
      applicationId: application.id,
      oldStatus: oldApp.status,
      newStatus: status,
      userId: session.user.id,
    });

    return apiResponse(application);
  } catch (error) {
    return handleApiError(error);
  }
}

import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { validateId } from "@/lib/params";
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
  ]).optional(),
  pipelineStageId: z.string().uuid().optional(),
}).refine((data) => data.status || data.pipelineStageId, {
  message: "status or pipelineStageId is required",
});

const stageToLegacyStatus: Record<string, ApplicationStatus> = {
  pending: "applied",
  awaiting_response: "applied",
  interview_internal: "interview_1",
  sent_to_review: "screening",
  interview_client: "interview_2",
  hired: "hired",
  rejected: "rejected",
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { valid, response } = validateId(params.id);
  if (!valid) return response!;

  try {
    const { session, errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { status, pipelineStageId } = statusUpdateSchema.parse(body);

    const oldApp = await db.application.findUnique({
      where: { id: params.id },
      select: { status: true, pipelineStage: true },
    });

    if (!oldApp) throw new ApiError("NOT_FOUND", "Application not found", 404);

    const pipelineStage = pipelineStageId
      ? await db.pipelineStage.findFirst({
          where: { id: pipelineStageId, isActive: true },
        })
      : null;

    if (pipelineStageId && !pipelineStage) {
      throw new ApiError("NOT_FOUND", "Pipeline stage not found", 404);
    }

    const nextStatus = pipelineStage
      ? stageToLegacyStatus[pipelineStage.slug]
      : (status as ApplicationStatus);

    const application = await db.$transaction(async (tx) => {
      const updated = await tx.application.update({
        where: { id: params.id },
        data: { 
          status: nextStatus,
          ...(pipelineStage ? { pipelineStageId: pipelineStage.id } : {}),
          lastContactAt: new Date(),
          lastContactedBy: session.user.id,
        },
        include: {
          pipelineStage: true,
          assignedTo: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: params.id,
          changedBy: session.user.id!,
          oldStatus: oldApp.status,
          newStatus: nextStatus,
          reason: pipelineStage
            ? `Pipeline stage: ${oldApp.pipelineStage?.name ?? oldApp.status} -> ${pipelineStage.name}`
            : undefined,
        },
      });

      return updated;
    });

    logger.info("Application status updated", {
      applicationId: application.id,
      oldStatus: oldApp.status,
      newStatus: nextStatus,
      userId: session.user.id,
    });

    return apiResponse(application);
  } catch (error) {
    return handleApiError(error);
  }
}

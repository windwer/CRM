import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import logger from "@/lib/logger";
import { NextRequest } from "next/server";
import { z } from "zod";

const bulkApplySchema = z.object({
  candidateIds: z.array(z.string().uuid()).min(1).max(50),
  offerId: z.string().uuid(),
  pipelineStageId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

    const body = bulkApplySchema.parse(await req.json());

    const offer = await db.offer.findUnique({
      where: { id: body.offerId },
      select: { id: true, status: true, title: true },
    });

    if (!offer) {
      throw new ApiError("NOT_FOUND", "Offer not found", 404);
    }

    if (offer.status === "closed_hired") {
      throw new ApiError(
        "VALIDATION_ERROR",
        "No se pueden anadir candidatos a una oferta cerrada con contratacion.",
        400
      );
    }

    const pipelineStage = body.pipelineStageId
      ? await db.pipelineStage.findFirst({
          where: { id: body.pipelineStageId, isActive: true },
        })
      : await db.pipelineStage.findFirst({
          where: { slug: "pending", isActive: true },
          orderBy: { order: "asc" },
        });

    const fallbackStage =
      pipelineStage ??
      (await db.pipelineStage.findFirst({
        where: { isActive: true },
        orderBy: { order: "asc" },
      }));

    if (!fallbackStage) {
      throw new ApiError("NOT_FOUND", "Pipeline stage not found", 404);
    }

    const candidates = await db.candidate.findMany({
      where: { id: { in: body.candidateIds }, archivedAt: null },
      select: { id: true, fullName: true },
    });

    if (candidates.length !== body.candidateIds.length) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "Alguno de los candidatos seleccionados no existe o esta archivado.",
        400
      );
    }

    const existingApplications = await db.application.findMany({
      where: {
        offerId: body.offerId,
        candidateId: { in: body.candidateIds },
      },
      include: {
        candidate: { select: { fullName: true } },
      },
    });

    const existingCandidateIds = new Set(
      existingApplications.map((application) => application.candidateId)
    );
    const toCreate = candidates.filter(
      (candidate) => !existingCandidateIds.has(candidate.id)
    );
    const now = new Date();

    const created = toCreate.length
      ? await db.application.createMany({
          data: toCreate.map((candidate) => ({
            candidateId: candidate.id,
            offerId: body.offerId,
            pipelineStageId: fallbackStage.id,
            appliedAt: now,
          })),
        })
      : { count: 0 };

    logger.info("Candidates linked to offer in bulk", {
      offerId: body.offerId,
      created: created.count,
      skipped: existingApplications.length,
      userId: session.user.id,
    });

    return apiResponse({
      created: created.count,
      skipped: existingApplications.length,
      skippedNames: existingApplications
        .map((application) => application.candidate.fullName)
        .slice(0, 5),
      total: body.candidateIds.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

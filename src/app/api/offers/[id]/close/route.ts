import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { validateId } from "@/lib/params";
import { NextRequest } from "next/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { valid, response } = validateId(params.id);
  if (!valid) return response!;

  try {
    const { session, errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

    const offer = await db.offer.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    });
    if (!offer) throw new ApiError("NOT_FOUND", "Oferta no encontrada", 404);
    if (!["published", "paused"].includes(offer.status)) {
      throw new ApiError("INVALID_STATE", "Solo se pueden cerrar ofertas publicadas o pausadas", 400);
    }

    const mayFitStage = await db.pipelineStage.findFirst({
      where: { slug: "may_fit_future", offerId: params.id },
      select: { id: true },
    });

    if (!mayFitStage) {
      await db.offer.update({
        where: { id: params.id },
        data: { status: "closed_no_hire", closedAt: new Date(), closedById: session.user.id! },
      });
      return apiResponse({ success: true, migrated: 0, requires_confirmation: false });
    }

    const candidatesToMigrate = await db.application.findMany({
      where: { offerId: params.id, pipelineStageId: mayFitStage.id },
      include: { candidate: { select: { id: true, fullName: true, email: true } } },
    });

    if (candidatesToMigrate.length === 0) {
      await db.offer.update({
        where: { id: params.id },
        data: { status: "closed_no_hire", closedAt: new Date(), closedById: session.user.id! },
      });
      return apiResponse({ success: true, migrated: 0, requires_confirmation: false });
    }

    return apiResponse({
      requires_confirmation: true,
      candidates_to_migrate: candidatesToMigrate.map((a) => ({
        application_id: a.id,
        candidate_id: a.candidate.id,
        full_name: a.candidate.fullName,
        email: a.candidate.email,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { validateId } from "@/lib/params";
import { z } from "zod";
import { NextRequest } from "next/server";

const confirmSchema = z.object({ confirmed: z.literal(true) });

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { valid, response } = validateId(params.id);
  if (!valid) return response!;

  try {
    const { session, errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

    const body = await req.json();
    confirmSchema.parse(body);

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

    let migrated = 0;

    await db.$transaction(async (tx) => {
      if (mayFitStage) {
        const apps = await tx.application.findMany({
          where: { offerId: params.id, pipelineStageId: mayFitStage.id },
          select: { candidateId: true },
        });
        if (apps.length > 0) {
          await tx.candidate.updateMany({
            where: { id: { in: apps.map((a) => a.candidateId) } },
            data: { talentPoolStatus: "may_fit_future" },
          });
          migrated = apps.length;
        }
      }

      await tx.offer.update({
        where: { id: params.id },
        data: { status: "closed_no_hire", closedAt: new Date(), closedById: session.user.id! },
      });
    });

    return apiResponse({ success: true, migrated });
  } catch (error) {
    return handleApiError(error);
  }
}

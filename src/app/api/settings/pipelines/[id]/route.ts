import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { validateId } from "@/lib/params";
import { pipelineRenameSchema } from "@/lib/validations/pipeline";
import { NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { valid, response } = validateId(params.id);
  if (!valid) return response!;

  try {
    const { errorResponse } = await requireRole("admin");
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { name } = pipelineRenameSchema.parse(body);

    const stage = await db.pipelineStage.findUnique({ where: { id: params.id } });
    if (!stage) throw new ApiError("NOT_FOUND", "Stage not found", 404);
    if (stage.isLocked) throw new ApiError("LOCKED", "No se puede renombrar un stage obligatorio", 403);

    const updated = await db.pipelineStage.update({
      where: { id: params.id },
      data: { name },
    });

    return apiResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { valid, response } = validateId(params.id);
  if (!valid) return response!;

  try {
    const { errorResponse } = await requireRole("admin");
    if (errorResponse) return errorResponse;

    const stage = await db.pipelineStage.findUnique({
      where: { id: params.id },
      select: { id: true, offerId: true, slug: true },
    });
    if (!stage) throw new ApiError("NOT_FOUND", "Stage not found", 404);
    if (stage.offerId !== null) throw new ApiError("FORBIDDEN", "Usa /offers/:id/pipeline/stages/:stageId para borrar stages de una oferta", 403);

    const usedByOffers = await db.pipelineStage.count({
      where: { slug: stage.slug, offerId: { not: null } },
    });
    if (usedByOffers > 0) {
      throw new ApiError("CONFLICT", `Este template está en uso por ${usedByOffers} oferta(s)`, 409);
    }

    await db.pipelineStage.delete({ where: { id: params.id } });

    return apiResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

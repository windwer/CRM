import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { validateId } from "@/lib/params";
import { updateStageSchema } from "@/lib/validations/pipeline";
import { NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; stageId: string } }
) {
  const offerCheck = validateId(params.id);
  if (!offerCheck.valid) return offerCheck.response!;
  const stageCheck = validateId(params.stageId);
  if (!stageCheck.valid) return stageCheck.response!;

  try {
    const { errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

    const stage = await db.pipelineStage.findFirst({
      where: { id: params.stageId, offerId: params.id },
    });
    if (!stage) throw new ApiError("NOT_FOUND", "Stage no encontrado", 404);
    if (stage.isLocked) throw new ApiError("LOCKED", "No se puede editar un stage obligatorio", 403);

    const body = await req.json();
    const data = updateStageSchema.parse(body);

    if (data.position !== undefined && data.position !== stage.order) {
      const others = await db.pipelineStage.findMany({
        where: { offerId: params.id, isActive: true, id: { not: params.stageId } },
      });
      const taken = others.some((s) => s.order === data.position && !s.isLocked);
      if (taken) {
        await db.pipelineStage.updateMany({
          where: { offerId: params.id, order: { gte: data.position }, isLocked: false, id: { not: params.stageId } },
          data: { order: { increment: 1 } },
        });
      }
    }

    const updated = await db.pipelineStage.update({
      where: { id: params.stageId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.position !== undefined ? { order: data.position } : {}),
      },
    });

    return apiResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; stageId: string } }
) {
  const offerCheck = validateId(params.id);
  if (!offerCheck.valid) return offerCheck.response!;
  const stageCheck = validateId(params.stageId);
  if (!stageCheck.valid) return stageCheck.response!;

  try {
    const { errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

    const stage = await db.pipelineStage.findFirst({
      where: { id: params.stageId, offerId: params.id },
    });
    if (!stage) throw new ApiError("NOT_FOUND", "Stage no encontrado", 404);
    if (stage.isLocked) throw new ApiError("LOCKED", "No se puede borrar un stage obligatorio", 403);

    const candidateCount = await db.application.count({
      where: { pipelineStageId: params.stageId },
    });
    if (candidateCount > 0) {
      return Response.json(
        { success: false, error: { code: "CONFLICT", message: `Hay ${candidateCount} candidatos en este stage`, candidate_count: candidateCount } },
        { status: 409 }
      );
    }

    await db.pipelineStage.delete({ where: { id: params.stageId } });

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}

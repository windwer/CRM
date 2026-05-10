import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { validateId } from "@/lib/params";
import { addStageSchema } from "@/lib/validations/pipeline";
import { NextRequest } from "next/server";

const MAX_INTERMEDIATE = 6;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { valid, response } = validateId(params.id);
  if (!valid) return response!;

  try {
    const { errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

    const offer = await db.offer.findUnique({ where: { id: params.id } });
    if (!offer) throw new ApiError("NOT_FOUND", "Oferta no encontrada", 404);

    const body = await req.json();
    const { name, position } = addStageSchema.parse(body);

    const existingStages = await db.pipelineStage.findMany({
      where: { offerId: params.id, isActive: true },
    });

    const intermediateCount = existingStages.filter((s) => !s.isLocked).length;
    if (intermediateCount >= MAX_INTERMEDIATE) {
      throw new ApiError("MAX_STAGES", `Máximo ${MAX_INTERMEDIATE} stages intermedios por oferta`, 400);
    }

    const positionTaken = existingStages.some((s) => s.order === position);
    if (positionTaken) {
      // Shift stages at same or higher position up by 1
      await db.pipelineStage.updateMany({
        where: { offerId: params.id, order: { gte: position }, isLocked: false },
        data: { order: { increment: 1 } },
      });
    }

    const newStage = await db.pipelineStage.create({
      data: {
        name,
        slug: `custom_${Date.now()}`,
        category: "in_progress",
        order: position,
        color: "#64748B",
        isDefault: false,
        isEditable: true,
        isActive: true,
        isLocked: false,
        offerId: params.id,
      },
    });

    return apiResponse(newStage, { status: 201 } as any);
  } catch (error) {
    return handleApiError(error);
  }
}

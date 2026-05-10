import { db } from "@/lib/db";
import { apiResponse, handleApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const { errorResponse } = await requireRole("viewer");
    if (errorResponse) return errorResponse;

    const templateStages = await db.pipelineStage.findMany({
      where: { offerId: null, isActive: true },
      orderBy: { order: "asc" },
      select: { id: true, name: true, slug: true, order: true, color: true, category: true, isLocked: true, isEditable: true },
    });

    const offerPipelines = await db.offer.findMany({
      where: { status: { in: ["draft", "published", "paused"] } },
      select: {
        id: true,
        title: true,
        pipelineStages: {
          where: { isActive: true },
          orderBy: { order: "asc" },
          select: { id: true, name: true, slug: true, order: true, color: true, category: true, isLocked: true, isEditable: true },
        },
      },
    });

    return apiResponse({
      templates: templateStages,
      by_offer: offerPipelines.map((o) => ({
        offer_id: o.id,
        offer_title: o.title,
        stages: o.pipelineStages,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST() {
  try {
    const { errorResponse } = await requireRole("admin");
    if (errorResponse) return errorResponse;

    return apiResponse(
      { message: "Solo se admite el pipeline 'Estándar' en esta versión" },
      { status: 501 } as any
    );
  } catch (error) {
    return handleApiError(error);
  }
}

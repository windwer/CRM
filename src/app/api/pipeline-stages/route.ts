import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiResponse, handleApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = await requireRole("viewer");
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const offerId = searchParams.get("offerId");

    let stages;
    if (offerId) {
      // Offer-specific stages; fall back to template if the offer has none
      stages = await db.pipelineStage.findMany({
        where: { offerId, isActive: true },
        orderBy: { order: "asc" },
      });

      if (stages.length === 0) {
        stages = await db.pipelineStage.findMany({
          where: { offerId: null, isActive: true },
          orderBy: { order: "asc" },
        });
      }
    } else {
      // No offerId — return only template stages (offerId IS NULL)
      stages = await db.pipelineStage.findMany({
        where: { offerId: null, isActive: true },
        orderBy: { order: "asc" },
      });
    }

    return apiResponse(stages);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST() {
  const { errorResponse } = await requireRole("admin");
  if (errorResponse) return errorResponse;

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "La edicion del pipeline estara disponible en proximas versiones.",
      },
    },
    { status: 405 }
  );
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiResponse, handleApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const { errorResponse } = await requireRole("viewer");
    if (errorResponse) return errorResponse;

    const stages = await db.pipelineStage.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

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

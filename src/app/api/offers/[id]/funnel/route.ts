import { db } from "@/lib/db";
import { apiResponse, handleApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { validateId } from "@/lib/params";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { valid, response } = validateId(params.id);
  if (!valid) return response!;

  try {
    const { errorResponse } = await requireRole("viewer");
    if (errorResponse) return errorResponse;

    // Get offer-specific stages ordered by position
    let stages = await db.pipelineStage.findMany({
      where: { offerId: params.id, isActive: true },
      orderBy: { order: "asc" },
      include: {
        _count: { select: { applications: true } },
      },
    });

    // Fall back to template stages if offer has no own stages
    if (stages.length === 0) {
      stages = await db.pipelineStage.findMany({
        where: { offerId: null, isActive: true },
        orderBy: { order: "asc" },
        include: {
          _count: { select: { applications: true } },
        },
      });
    }

    const stageData = stages.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      color: s.color ?? "#94A3B8",
      position: s.order,
      count: s._count.applications,
    }));

    const totalApplicants = stageData.reduce((sum, s) => sum + s.count, 0);
    const hired = stageData.find((s) => s.slug === "hired")?.count ?? 0;
    const rejected = stageData.find((s) => s.slug === "rejected")?.count ?? 0;

    // Legacy fields kept for backwards compatibility with existing consumers
    return apiResponse({
      stages: stageData,
      totalApplicants,
      hired,
      rejected,
      // Legacy shape (used by old FunnelChart)
      applied: totalApplicants,
      prospects: 0,
      interviewing: 0,
      offers: 0,
      smartway: 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

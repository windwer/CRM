import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]?.slice(0, 2).toUpperCase() ?? "?";
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { errorResponse } = await requireRole("viewer");
    if (errorResponse) return errorResponse;

    const offer = await db.offer.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        status: true,
        assignedTo: {
          select: { id: true, name: true },
        },
      },
    });

    if (!offer) {
      throw new ApiError("NOT_FOUND", "Oferta no encontrada", 404);
    }

    // Fetch offer-specific pipeline stages
    const stages = await db.pipelineStage.findMany({
      where: { offerId: params.id, isActive: true },
      orderBy: { order: "asc" },
      include: {
        applications: {
          where: { offer: { id: params.id } },
          select: {
            id: true,
            appliedAt: true,
            aiScore: true,
            candidate: {
              select: { id: true, fullName: true, email: true },
            },
          },
          orderBy: { appliedAt: "desc" },
        },
      },
    });

    // Fall back to template stages if no offer-specific stages exist
    const effectiveStages =
      stages.length > 0
        ? stages
        : await db.pipelineStage.findMany({
            where: { offerId: null, isActive: true },
            orderBy: { order: "asc" },
            include: {
              applications: {
                where: { offerId: params.id },
                select: {
                  id: true,
                  appliedAt: true,
                  aiScore: true,
                  candidate: {
                    select: { id: true, fullName: true, email: true },
                  },
                },
                orderBy: { appliedAt: "desc" },
              },
            },
          });

    return apiResponse({
      offer: {
        id: offer.id,
        title: offer.title,
        status: offer.status,
        assignee: offer.assignedTo
          ? {
              id: offer.assignedTo.id,
              name: offer.assignedTo.name,
              initials: getInitials(offer.assignedTo.name),
            }
          : null,
      },
      stages: effectiveStages.map((stage) => ({
        id: stage.id,
        name: stage.name,
        position: stage.order,
        color: stage.color ?? "#94A3B8",
        is_locked: stage.isLocked,
        applications: stage.applications.map((app) => ({
          id: app.id,
          applied_at: app.appliedAt,
          ai_score: app.aiScore ? Number(app.aiScore) : null,
          candidate: {
            id: app.candidate.id,
            full_name: app.candidate.fullName,
            email: app.candidate.email,
            initials: getInitials(app.candidate.fullName),
          },
        })),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

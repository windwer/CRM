import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { validateId } from "@/lib/params";
import { NextRequest } from "next/server";
import { applicationUpdateSchema } from "@/lib/validations/application";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { valid, response } = validateId(params.id);
  if (!valid) return response!;

  try {
    const { errorResponse } = await requireRole("viewer");
    if (errorResponse) return errorResponse;

    const application = await db.application.findUnique({
      where: { id: params.id },
      include: {
        offer: {
          include: {
            hiredApplication: {
              select: {
                id: true,
                candidate: { select: { id: true, fullName: true, email: true } },
              },
            },
          },
        },
        candidate: true,
        pipelineStage: true,
        assignedTo: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true },
        },
        statusHistory: {
          orderBy: { changedAt: "desc" },
          include: {
            author: { select: { name: true } },
          },
        },
        communications: {
          orderBy: { sentAt: "desc" },
        },
      },
    });

    if (!application) throw new ApiError("NOT_FOUND", "Application not found", 404);

    return apiResponse(application);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { valid, response } = validateId(params.id);
  if (!valid) return response!;

  try {
    const { errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

    const validation = applicationUpdateSchema.safeParse(await req.json());
    if (!validation.success) {
      throw new ApiError("VALIDATION_ERROR", validation.error.message, 400);
    }

    const existing = await db.application.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!existing) {
      throw new ApiError("NOT_FOUND", "Solicitud no encontrada", 404);
    }

    const updated = await db.application.update({
      where: { id: params.id },
      data: {
        ...(validation.data.internal_notes !== undefined
          ? { internalNotes: validation.data.internal_notes }
          : {}),
        ...(validation.data.candidateNotes !== undefined
          ? { candidateNotes: validation.data.candidateNotes }
          : {}),
        ...(validation.data.pipelineStageId !== undefined
          ? { pipelineStageId: validation.data.pipelineStageId }
          : {}),
        ...(validation.data.assignedToId !== undefined
          ? { assignedToId: validation.data.assignedToId }
          : {}),
        updatedAt: new Date(),
      },
      include: {
        pipelineStage: true,
        assignedTo: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
      },
    });

    return apiResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

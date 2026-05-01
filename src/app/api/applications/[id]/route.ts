import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { validateId } from "@/lib/params";
import { NextRequest } from "next/server";
import { z } from "zod";

const updateApplicationSchema = z
  .object({
    internal_notes: z.string().max(5000).optional(),
  })
  .strict();

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
        offer: true,
        candidate: true,
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

    const validation = updateApplicationSchema.safeParse(await req.json());
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
        updatedAt: new Date(),
      },
    });

    return apiResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

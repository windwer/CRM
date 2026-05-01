import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { validateId } from "@/lib/params";
import { candidateUpdateSchema } from "@/lib/validations/candidate";
import logger from "@/lib/logger";
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

    const candidate = await db.candidate.findUnique({
      where: { id: params.id },
      include: {
        applications: {
          include: {
            offer: {
              select: { title: true },
            },
            communications: {
              orderBy: { sentAt: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!candidate) throw new ApiError("NOT_FOUND", "Candidate not found", 404);

    return apiResponse(candidate);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { valid, response } = validateId(params.id);
  if (!valid) return response!;

  try {
    const { session, errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const validatedData = candidateUpdateSchema.parse(body);

    const candidate = await db.candidate.update({
      where: { id: params.id },
      data: validatedData,
    });

    logger.info("Candidate updated", { candidateId: candidate.id, userId: session.user.id });

    return apiResponse(candidate);
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
    const { session, errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

    const candidate = await db.$transaction(async (tx) => {
      const updated = await tx.candidate.update({
        where: { id: params.id },
        data: { 
          archivedAt: new Date(),
          archivedBy: session.user.id,
        },
      });

      return updated;
    });

    logger.info("Candidate archived", {
      candidateId: candidate.id,
      userId: session.user.id,
    });

    return apiResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

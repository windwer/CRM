import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { validateId } from "@/lib/params";
import { offerUpdateSchema } from "@/lib/validations/offer";
import { ALLOWED_TRANSITIONS } from "@/lib/offer-transitions";
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

    const offer = await db.offer.findUnique({
      where: { id: params.id },
      include: {
        closedBy: { select: { name: true } },
        reopenedBy: { select: { name: true } },
        hiredApplication: {
          select: {
            id: true,
            candidate: { select: { id: true, fullName: true, email: true } },
          },
        },
        applications: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            candidate: { select: { id: true, fullName: true, email: true } },
            pipelineStage: { select: { id: true, name: true, color: true, slug: true } },
          },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!offer) throw new ApiError("NOT_FOUND", "Offer not found", 404);

    return apiResponse({
      ...offer,
      allowedTransitions: ALLOWED_TRANSITIONS[offer.status] ?? [],
    });
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
    const validatedData = offerUpdateSchema.parse(body);
    delete (validatedData as { status?: unknown }).status;

    const offer = await db.$transaction(async (tx) => {
      const before = await tx.offer.findUnique({
        where: { id: params.id },
        select: { id: true },
      });

      if (!before) throw new ApiError("NOT_FOUND", "Offer not found", 404);

      const updated = await tx.offer.update({
        where: { id: params.id },
        data: validatedData,
      });

      await tx.offerChange.create({
        data: {
          offerId: params.id,
          changedBy: session.user.id!,
          fieldName: "general_edit",
          oldValue: null,
          newValue: null,
        },
      });

      return updated;
    });

    logger.info("Offer updated", { offerId: offer.id, userId: session.user.id });

    return apiResponse(offer);
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
    const { session, errorResponse } = await requireRole("admin");
    if (errorResponse) return errorResponse;

    const offer = await db.offer.update({
      where: { id: params.id },
      data: { status: "closed_no_hire", closedAt: new Date(), closedById: session.user.id! },
    });

    logger.info("Offer archived (soft delete)", { offerId: offer.id, userId: session.user.id });

    return apiResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

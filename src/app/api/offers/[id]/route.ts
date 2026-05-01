import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { validateId } from "@/lib/params";
import { offerUpdateSchema } from "@/lib/validations/offer";
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
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!offer) throw new ApiError("NOT_FOUND", "Offer not found", 404);

    return apiResponse(offer);
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

    const offer = await db.offer.update({
      where: { id: params.id },
      data: validatedData,
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
      data: { status: "archived" },
    });

    logger.info("Offer archived (soft delete)", { offerId: offer.id, userId: session.user.id });

    return apiResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

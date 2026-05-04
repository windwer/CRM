import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { validateId } from "@/lib/params";
import { canTransition } from "@/lib/offer-transitions";
import { closeOffer, reopenOffer } from "@/lib/offer-close";
import logger from "@/lib/logger";

const statusSchema = z.object({
  status: z.enum(["published", "paused", "closed_hired", "closed_no_hire"]),
  hiredApplicationId: z.string().uuid().optional(),
});

function mapOfferCloseError(error: unknown): ApiError | null {
  if (!(error instanceof Error)) return null;

  if (error.message === "HIRED_APPLICATION_REQUIRED") {
    return new ApiError("VALIDATION_ERROR", "HIRED_APPLICATION_REQUIRED", 400);
  }
  if (error.message === "HIRED_APPLICATION_NOT_IN_OFFER") {
    return new ApiError("VALIDATION_ERROR", "El candidato contratado no pertenece a esta oferta", 400);
  }
  if (error.message === "OFFER_CANNOT_BE_REOPENED") {
    return new ApiError(
      "VALIDATION_ERROR",
      "Las ofertas cerradas con contratacion no se pueden reabrir. Crea una nueva posicion si necesitas volver a contratar.",
      400
    );
  }
  return null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { valid, response } = validateId(params.id);
  if (!valid) return response!;

  try {
    const { session, errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

    const { status: newStatus, hiredApplicationId } = statusSchema.parse(await req.json());
    const offer = await db.offer.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    });

    if (!offer) throw new ApiError("NOT_FOUND", "Offer not found", 404);

    if (!canTransition(offer.status, newStatus)) {
      if (offer.status === "closed_hired" && newStatus === "published") {
        throw new ApiError(
          "VALIDATION_ERROR",
          "Las ofertas cerradas con contratacion no se pueden reabrir. Crea una nueva posicion si necesitas volver a contratar.",
          400
        );
      }
      throw new ApiError(
        "VALIDATION_ERROR",
        `No se puede cambiar el estado de '${offer.status}' a '${newStatus}'`,
        400
      );
    }

    if (newStatus === "closed_hired" && !hiredApplicationId) {
      throw new ApiError("VALIDATION_ERROR", "HIRED_APPLICATION_REQUIRED", 400);
    }

    await db.$transaction(async (tx) => {
      if (newStatus === "closed_hired" || newStatus === "closed_no_hire") {
        await closeOffer({
          offerId: params.id,
          status: newStatus,
          hiredApplicationId,
          closedById: session.user.id!,
          oldStatus: offer.status,
          tx,
        });
        return;
      }

      if (newStatus === "published" && offer.status === "closed_no_hire") {
        await reopenOffer({
          offerId: params.id,
          reopenedById: session.user.id!,
          tx,
        });
        return;
      }

      await tx.offer.update({
        where: { id: params.id },
        data: { status: newStatus },
      });

      await tx.offerChange.create({
        data: {
          offerId: params.id,
          changedBy: session.user.id!,
          fieldName: "status",
          oldValue: offer.status,
          newValue: newStatus,
        },
      });
    });

    const updated = await db.offer.findUnique({
      where: { id: params.id },
      include: {
        closedBy: { select: { name: true } },
        reopenedBy: { select: { name: true } },
      },
    });

    logger.info("Offer status changed", {
      offerId: params.id,
      oldStatus: offer.status,
      newStatus,
      userId: session.user.id,
    });

    return apiResponse(updated);
  } catch (error) {
    const mappedError = mapOfferCloseError(error);
    if (mappedError) return handleApiError(mappedError);
    return handleApiError(error);
  }
}

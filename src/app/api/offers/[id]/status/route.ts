import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import logger from "@/lib/logger";
import { NextRequest } from "next/server";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["published", "paused", "closed", "archived"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);

    const body = await req.json();
    const { status } = statusSchema.parse(body);

    const oldOffer = await db.offer.findUnique({
      where: { id: params.id },
      select: { status: true },
    });

    if (!oldOffer) throw new ApiError("NOT_FOUND", "Offer not found", 404);

    const offer = await db.$transaction(async (tx) => {
      const updated = await tx.offer.update({
        where: { id: params.id },
        data: { status },
      });

      await tx.offerChange.create({
        data: {
          offerId: params.id,
          changedBy: session.user.id!,
          fieldName: "status",
          oldValue: oldOffer.status,
          newValue: status,
        },
      });

      return updated;
    });

    logger.info("Offer status changed", {
      offerId: offer.id,
      oldStatus: oldOffer.status,
      newStatus: status,
      userId: session.user.id,
    });

    return apiResponse(offer);
  } catch (error) {
    return handleApiError(error);
  }
}

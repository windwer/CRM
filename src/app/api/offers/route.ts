import { db } from "@/lib/db";
import { OfferStatus } from "@antigravity/database";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { parsePagination, buildMeta } from "@/lib/pagination";
import { offerSchema } from "@/lib/validations/offer";
import { ALLOWED_TRANSITIONS } from "@/lib/offer-transitions";
import logger from "@/lib/logger";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = await requireRole("viewer");
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const { page, limit, skip, take } = parsePagination(searchParams);

    const where =
      status === "closed"
        ? { status: { in: ["closed_hired", "closed_no_hire"] as OfferStatus[] } }
        : status
          ? { status: status as OfferStatus }
          : {};

    const [offers, total] = await db.$transaction([
      db.offer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      db.offer.count({ where }),
    ]);

    return apiResponse(
      offers.map((offer) => ({
        ...offer,
        allowedTransitions: ALLOWED_TRANSITIONS[offer.status] ?? [],
      })),
      buildMeta(total, page, limit)
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const validatedData = offerSchema.parse(body);

    const offer = await db.offer.create({
      data: {
        ...validatedData,
        createdBy: session.user.id!,
      },
    });

    logger.info("Offer created", { offerId: offer.id, userId: session.user.id });

    return apiResponse(offer);
  } catch (error) {
    return handleApiError(error);
  }
}

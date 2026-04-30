import { auth } from "../../../../auth";
import { db } from "@/lib/db";
import { OfferStatus } from "@antigravity/database";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { offerSchema } from "@/lib/validations/offer";
import logger from "@/lib/logger";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where = status ? { status: status as OfferStatus } : {};

    const [offers, total] = await Promise.all([
      db.offer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.offer.count({ where }),
    ]);

    return apiResponse(offers, { total, page, limit });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);
    
    const role = session.user.role;
    if (role !== "admin" && role !== "recruiter") {
      throw new ApiError("FORBIDDEN", "Forbidden", 403);
    }

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

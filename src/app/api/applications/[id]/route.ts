import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);

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

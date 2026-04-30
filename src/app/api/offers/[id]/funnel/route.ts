import { auth } from "../../../../../../auth";
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

    const stats = await db.application.groupBy({
      by: ["status"],
      where: { offerId: params.id },
      _count: {
        _all: true,
      },
    });

    const funnel = stats.reduce((acc, curr) => {
      acc[curr.status] = curr._count._all;
      return acc;
    }, {} as Record<string, number>);

    return apiResponse(funnel);
  } catch (error) {
    return handleApiError(error);
  }
}

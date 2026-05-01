import { db } from "@/lib/db";
import { apiResponse, handleApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { validateId } from "@/lib/params";
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

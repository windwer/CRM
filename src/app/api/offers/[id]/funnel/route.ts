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

    const applications = await db.application.findMany({
      where: { offerId: params.id },
      include: {
        pipelineStage: {
          select: {
            slug: true,
          },
        },
      },
    });

    const funnel = applications.reduce(
      (acc, application) => {
        const slug = application.pipelineStage?.slug;

        if (slug === "hired") {
          acc.hired++;
        } else if (slug === "rejected") {
          acc.rejected++;
        } else if (slug === "interview_internal" || slug === "interview_client") {
          acc.interviewing++;
        } else if (
          slug === "sent_to_review" ||
          slug === "sent_to_client" ||
          slug === "sent_to_review_client"
        ) {
          acc.offers++;
        } else if (slug === "awaiting_response") {
          acc.applied++;
        } else {
          acc.prospects++;
        }

        return acc;
      },
      {
        prospects: 0,
        applied: 0,
        interviewing: 0,
        offers: 0,
        hired: 0,
        rejected: 0,
      }
    );

    return apiResponse(funnel);
  } catch (error) {
    return handleApiError(error);
  }
}

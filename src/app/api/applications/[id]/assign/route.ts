import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { validateId } from "@/lib/params";

const assignSchema = z.object({
  assignedToId: z.string().uuid().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { valid, response } = validateId(params.id);
  if (!valid) return response!;

  try {
    const { errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

    const { assignedToId } = assignSchema.parse(await req.json());

    if (assignedToId) {
      const user = await db.user.findFirst({
        where: {
          id: assignedToId,
          role: { in: ["recruiter", "admin"] },
          isActive: true,
        },
      });

      if (!user) {
        throw new ApiError("VALIDATION_ERROR", "Assigned user must be recruiter or admin", 400);
      }
    }

    const application = await db.application.update({
      where: { id: params.id },
      data: { assignedToId },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
        pipelineStage: true,
      },
    });

    return apiResponse(application);
  } catch (error) {
    return handleApiError(error);
  }
}

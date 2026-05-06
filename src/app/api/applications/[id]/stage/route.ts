import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth-helpers";
import { validateId } from "@/lib/params";
import { changeApplicationStage } from "@/lib/application-stage";
import { handleApiError, ApiError } from "@/lib/errors";

const bodySchema = z.object({
  pipelineStageId: z.string().uuid(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { valid, response } = validateId(params.id);
  if (!valid) return response!;

  try {
    const { session, errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "pipelineStageId (uuid) is required",
        400
      );
    }

    const result = await changeApplicationStage({
      applicationId: params.id,
      newStageId: parsed.data.pipelineStageId,
      changedById: session.user.id,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return handleApiError(err);
  }
}

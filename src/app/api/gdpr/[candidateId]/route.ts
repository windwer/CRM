import { apiResponse, handleApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { validateId } from "@/lib/params";
import { anonymizeCandidate } from "@/lib/gdpr";
import { NextRequest } from "next/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { candidateId: string } }
) {
  const { valid, response } = validateId(params.candidateId);
  if (!valid) return response!;

  try {
    const { errorResponse } = await requireRole("admin");
    if (errorResponse) return errorResponse;

    const result = await anonymizeCandidate(params.candidateId);

    return apiResponse({ success: true, candidateId: result.id });
  } catch (error) {
    return handleApiError(error);
  }
}

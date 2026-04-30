import { auth } from "../../../../../auth";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { anonymizeCandidate } from "@/lib/gdpr";
import { NextRequest } from "next/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { candidateId: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);

    if (session.user.role !== "admin") {
      throw new ApiError("FORBIDDEN", "Only admins can execute GDPR deletion", 403);
    }

    const result = await anonymizeCandidate(params.candidateId);

    return apiResponse({ success: true, candidateId: result.id });
  } catch (error) {
    return handleApiError(error);
  }
}

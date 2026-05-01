import { apiResponse, handleApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { syncInboxForUser } from "@/lib/outlook/syncService";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

    const result = await syncInboxForUser(session.user.id);

    return apiResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

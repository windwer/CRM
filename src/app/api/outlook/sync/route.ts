import { auth } from "../../../../../auth";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { syncInboxForUser } from "@/lib/outlook/syncService";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);
    }

    const result = await syncInboxForUser(session.user.id);

    return apiResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

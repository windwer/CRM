import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);
    }

    const [oauthAccount, syncState] = await Promise.all([
      db.oAuthAccount.findFirst({
        where: { userId: session.user.id, provider: "microsoft-entra-id" },
      }),
      db.outlookSyncState.findUnique({
        where: { userId: session.user.id },
      }),
    ]);

    return apiResponse({
      connected: !!oauthAccount,
      last_sync_at: syncState?.lastSyncAt || null,
      last_error: syncState?.lastError || null,
      sync_status: syncState?.syncStatus || "pending",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);
    }

    await Promise.all([
      db.oAuthAccount.deleteMany({
        where: { userId: session.user.id, provider: "microsoft-entra-id" },
      }),
      db.outlookSyncState.deleteMany({
        where: { userId: session.user.id },
      }),
    ]);

    return apiResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

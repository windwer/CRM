import { db } from "@/lib/db";
import { apiResponse, handleApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

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
    const { session, errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

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

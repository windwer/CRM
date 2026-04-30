import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { syncInboxForUser } from "@/lib/outlook/syncService";
import logger from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const requestSecret = req.headers.get("x-cron-secret");

    if (!cronSecret || requestSecret !== cronSecret) {
      throw new ApiError("UNAUTHORIZED", "Invalid cron secret", 401);
    }

    const users = await db.user.findMany({
      where: {
        isActive: true,
        oauthAccounts: {
          some: {
            provider: "microsoft-entra-id",
            accessToken: { not: null },
          },
        },
      },
      select: { id: true, email: true },
    });

    const results = await Promise.all(
      users.map(async (user) => {
        try {
          const result = await syncInboxForUser(user.id);
          return {
            userId: user.id,
            email: user.email,
            synced_emails: result.synced_emails,
            error: null,
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          logger.error("Scheduled Outlook sync failed for user", {
            userId: user.id,
            error: message,
          });

          return {
            userId: user.id,
            email: user.email,
            synced_emails: 0,
            error: message,
          };
        }
      })
    );

    const errors = results
      .filter((result) => result.error)
      .map((result) => ({
        user_id: result.userId,
        email: result.email,
        error: result.error,
      }));

    return apiResponse({
      users_synced: results.filter((result) => !result.error).length,
      total_emails: results.reduce((sum, result) => sum + result.synced_emails, 0),
      errors,
    });
  } catch (error) {
    return handleApiError(error);
  }
}


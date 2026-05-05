import { NextRequest } from "next/server";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { runGDPRCleanup } from "@/lib/gdpr";
import logger from "@/lib/logger";

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");

  if (!secret || secret !== process.env.CRON_SECRET) {
    return handleApiError(
      new ApiError("UNAUTHORIZED", "Invalid cron secret", 401)
    );
  }

  try {
    const result = await runGDPRCleanup();
    return apiResponse(result);
  } catch (error) {
    logger.error("GDPR cron failed", { error });
    return handleApiError(
      new ApiError(
        "GDPR_CLEANUP_FAILED",
        error instanceof Error ? error.message : "GDPR cleanup failed",
        500
      )
    );
  }
}

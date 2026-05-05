import cron from "node-cron";
import logger from "@/lib/logger";

const globalForCron = globalThis as unknown as {
  outlookSyncCronStarted?: boolean;
  gdprCleanupCronStarted?: boolean;
};

export function registerCronJobs() {
  const enabled =
    process.env.NODE_ENV === "production" || process.env.ENABLE_CRON === "true";

  if (!enabled) {
    return;
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    logger.warn("Outlook cron skipped: CRON_SECRET is not configured");
    return;
  }

  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  if (!globalForCron.outlookSyncCronStarted) {
    cron.schedule("*/15 * * * *", async () => {
      try {
        const response = await fetch(`${baseUrl}/api/cron/outlook-sync`, {
          headers: { "x-cron-secret": cronSecret },
        });

        if (!response.ok) {
          logger.error("Scheduled Outlook sync returned non-OK response", {
            status: response.status,
          });
        }
      } catch (error) {
        logger.error("Scheduled Outlook sync request failed", { error });
      }
    });

    globalForCron.outlookSyncCronStarted = true;
    logger.info("Outlook sync cron registered");
  }

  if (!globalForCron.gdprCleanupCronStarted) {
    const gdprSchedule = process.env.GDPR_CRON_SCHEDULE ?? "0 3 * * *";

    cron.schedule(gdprSchedule, async () => {
      try {
        const response = await fetch(`${baseUrl}/api/cron/gdpr-cleanup`, {
          method: "GET",
          headers: { "x-cron-secret": cronSecret },
        });
        const json = await response.json();
        logger.info("GDPR cron tick", json);
      } catch (error) {
        logger.error("GDPR cron tick failed", { error });
      }
    });

    globalForCron.gdprCleanupCronStarted = true;
    logger.info("GDPR cleanup cron registered", { schedule: gdprSchedule });
  }
}

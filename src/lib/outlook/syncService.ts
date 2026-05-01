import { db } from "@/lib/db";
import { getValidAccessToken, GraphService } from "./graphService";
import logger from "../logger";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true when a Microsoft Graph error indicates the delta token is stale
 * (HTTP 410 Gone, or specific error codes that mean "resync from scratch").
 */
export function isInvalidDeltaError(error: unknown): boolean {
  const e = error as { status?: number; statusCode?: number; message?: string; code?: string };
  if (e?.statusCode === 410 || e?.status === 410) return true;
  const msg = `${e?.message ?? ""} ${e?.code ?? ""}`.toLowerCase();
  return (
    msg.includes("syncstatenotfound") ||
    msg.includes("invalidsynctoken") ||
    msg.includes("resync required")
  );
}

// ─── Main sync function ───────────────────────────────────────────────────────

/**
 * Synchronises the Outlook inbox for a user:
 * 1. Refreshes the access token if needed (via getValidAccessToken).
 * 2. Fetches delta emails; on 410 Gone resets to a full sync automatically.
 * 3. Batch-resolves all candidate matches in a single DB query (no N+1).
 * 4. Upserts communications by emailId (idempotent — safe to run twice).
 */
export async function syncInboxForUser(userId: string) {
  try {
    // 1. Get a valid (possibly just-refreshed) access token
    const accessToken = await getValidAccessToken(userId);

    // 2. Fetch the user's email for recording emailTo on inbound communications
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    // 3. Initialise Graph client
    const graph = new GraphService(accessToken);

    // 4. Load last sync state (delta token)
    const syncState = await db.outlookSyncState.findUnique({
      where: { userId },
    });

    // 5. Fetch delta emails — fall back to full sync on invalid delta token
    let emails: any[];
    let deltaLink: string | undefined;

    try {
      const result = await graph.getDeltaEmails(
        syncState?.lastChangeToken ?? undefined
      );
      emails = result.emails;
      deltaLink = result.deltaLink;
    } catch (error) {
      if (isInvalidDeltaError(error)) {
        logger.warn("Delta token inválido, iniciando sincronización completa", {
          userId,
        });
        await db.outlookSyncState.upsert({
          where: { userId },
          create: { userId, lastChangeToken: null, syncStatus: "syncing" },
          update: { lastChangeToken: null },
        });
        const result = await graph.getDeltaEmails(undefined); // full sync
        emails = result.emails;
        deltaLink = result.deltaLink;
      } else {
        throw error;
      }
    }

    const syncedCount = emails.length;
    let matchCount = 0;

    // 6. Batch candidate lookup — one query for all sender emails (no N+1)
    const senderEmails = emails
      .map((e: any) => e.from?.emailAddress?.address as string | undefined)
      .filter((addr): addr is string => Boolean(addr))
      .map((addr) => addr.toLowerCase());

    const candidates = await db.candidate.findMany({
      where: { email: { in: senderEmails } },
      include: {
        applications: {
          where: { status: { not: "rejected" } },
          orderBy: { appliedAt: "desc" },
          take: 1,
          include: { offer: { select: { id: true, title: true } } },
        },
      },
    });

    // O(1) lookup map: senderEmail → candidate
    const candidateByEmail = new Map(
      candidates.map((candidate) => [candidate.email.toLowerCase(), candidate])
    );

    // 7. Process emails
    for (const email of emails) {
      const senderEmail = email.from?.emailAddress?.address;
      if (!senderEmail) continue;

      const candidate = candidateByEmail.get(senderEmail.toLowerCase());
      if (!candidate || candidate.applications.length === 0) continue;

      const application = candidate.applications[0];
      matchCount++;

      // 8. Upsert communication — idempotent on emailId (@@unique constraint)
      await db.communication.upsert({
        where: { emailId: email.id },
        create: {
          applicationId: application.id,
          type: "email",
          isOutbound: false,
          emailId: email.id,
          subject: email.subject,
          body: email.body?.content ?? email.bodyPreview,
          sentBy: userId,
          sentAt: new Date(email.receivedDateTime),
          emailFrom: senderEmail,
          emailTo: user?.email ?? null,
        },
        update: {}, // already synced — nothing to change
      });

      // Keep application last-contact timestamp current
      await db.application.update({
        where: { id: application.id },
        data: { lastContactAt: new Date() },
      });
    }

    // 9. Persist updated delta token
    const deltaToken = deltaLink
      ? new URL(deltaLink).searchParams.get("$deltatoken")
      : null;

    await db.outlookSyncState.upsert({
      where: { userId },
      create: {
        userId,
        lastSyncAt: new Date(),
        lastChangeToken: deltaToken,
        syncStatus: "synced",
      },
      update: {
        lastSyncAt: new Date(),
        lastChangeToken: deltaToken ?? syncState?.lastChangeToken,
        syncStatus: "synced",
      },
    });

    logger.info("Outlook sync completed", { userId, syncedCount, matchCount });

    return {
      synced_emails: syncedCount,
      new_communications: matchCount,
      last_sync_at: new Date(),
    };
  } catch (error: any) {
    logger.error("Outlook sync failed", { userId, error: error.message });

    // Don't overwrite 'disconnected' status already set by getValidAccessToken
    if (error.code !== "OUTLOOK_TOKEN_EXPIRED") {
      await db.outlookSyncState.upsert({
        where: { userId },
        create: { userId, syncStatus: "error", lastError: error.message },
        update: { syncStatus: "error", lastError: error.message },
      });
    }

    throw error;
  }
}

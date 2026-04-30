import { db } from "@/lib/db";
import { GraphService } from "./graphService";
import logger from "../logger";

/**
 * Synchronizes the Outlook inbox for a specific user.
 * 1. Fetches unread/new emails using Microsoft Graph Delta API.
 * 2. Matches emails against candidate database.
 * 3. Creates communication records for matches.
 */
export async function syncInboxForUser(userId: string) {
  try {
    // 1. Get user and their Microsoft token
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        oauthAccounts: {
          where: { provider: "microsoft-entra-id" },
          take: 1
        }
      }
    });

    const oauthAccount = user?.oauthAccounts[0];

    if (!user || !oauthAccount || !oauthAccount.accessToken) {
      throw new Error("User has no connected Microsoft account or missing access token");
    }

    // 2. Initialize Graph Service
    const graph = new GraphService(oauthAccount.accessToken);

    // 3. Get last sync state
    const syncState = await db.outlookSyncState.findUnique({
      where: { userId },
    });

    // 4. Fetch delta emails
    const { emails, deltaLink } = await graph.getDeltaEmails(syncState?.lastChangeToken || undefined);
    
    let syncedCount = 0;
    let matchCount = 0;

    for (const email of emails) {
      syncedCount++;
      
      // Get sender email address
      const senderEmail = email.from?.emailAddress?.address;
      if (!senderEmail) continue;

      // 5. Match against candidates
      const candidate = await db.candidate.findUnique({
        where: { email: senderEmail },
        include: {
          applications: {
            where: { status: { not: "rejected" } },
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      });

      if (candidate && candidate.applications.length > 0) {
        const application = candidate.applications[0];

        // 6. Create communication record if it doesn't exist
        const existingComm = await db.communication.findFirst({
          where: { emailId: email.id }
        });

        if (!existingComm) {
          await db.communication.create({
            data: {
              applicationId: application.id,
              type: "email",
              subject: email.subject,
              body: email.body?.content || email.bodyPreview,
              sentBy: userId, // Inbound emails are "sent by" the system user in this context, or we can use a system ID
              sentAt: new Date(email.receivedDateTime),
              emailId: email.id,
              emailFrom: senderEmail,
              emailTo: user.email,
              isOutbound: false,
            }
          });
          matchCount++;
          
          // Update application last contact
          await db.application.update({
            where: { id: application.id },
            data: { lastContactAt: new Date() }
          });
        }
      }
    }

    // 7. Update sync state
    const deltaToken = deltaLink ? new URL(deltaLink).searchParams.get("$deltatoken") : null;

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
        lastChangeToken: deltaToken || syncState?.lastChangeToken,
        syncStatus: "synced",
      }
    });

    logger.info("Outlook sync completed", { userId, syncedCount, matchCount });

    return {
      synced_emails: syncedCount,
      new_communications: matchCount,
      last_sync_at: new Date(),
    };
  } catch (error: any) {
    logger.error("Outlook sync failed", { userId, error: error.message });
    
    await db.outlookSyncState.upsert({
      where: { userId },
      create: {
        userId,
        syncStatus: "error",
        lastError: error.message,
      },
      update: {
        syncStatus: "error",
        lastError: error.message,
      }
    });
    
    throw error;
  }
}

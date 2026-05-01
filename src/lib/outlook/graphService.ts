import { Client } from "@microsoft/microsoft-graph-client";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/errors";

// ─── Token refresh ───────────────────────────────────────────────────────────

/**
 * Returns a valid Microsoft access token for the user, refreshing it if it
 * expires within the next 5 minutes.  On unrecoverable failure (revoked /
 * expired refresh token) marks the sync state as 'disconnected' and throws
 * an ApiError with code OUTLOOK_TOKEN_EXPIRED so the frontend can show the
 * reconnect banner.
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const oauthAccount = await db.oAuthAccount.findFirst({
    where: {
      userId,
      provider: { in: ["microsoft", "microsoft-entra-id"] },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!oauthAccount?.accessToken) {
    throw new ApiError(
      "OUTLOOK_TOKEN_EXPIRED",
      "No hay cuenta de Microsoft conectada.",
      401
    );
  }

  const BUFFER_MS = 5 * 60 * 1000; // 5 min
  const isNearExpiry =
    !oauthAccount.expiresAt ||
    oauthAccount.expiresAt.getTime() < Date.now() + BUFFER_MS;

  if (!isNearExpiry) {
    return oauthAccount.accessToken;
  }

  // ── Attempt refresh ────────────────────────────────────────────────────────
  if (!oauthAccount.refreshToken) {
    await markDisconnected(userId, "Token expirado. El usuario debe reconectar Outlook.");
    throw new ApiError(
      "OUTLOOK_TOKEN_EXPIRED",
      "Token expirado. El usuario debe reconectar Outlook.",
      401
    );
  }

  const tenantId = process.env.MICROSOFT_TENANT_ID ?? "common";
  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  try {
    const refreshResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        refresh_token: oauthAccount.refreshToken,
        grant_type: "refresh_token",
        scope: "offline_access Mail.ReadWrite Mail.Send",
      }).toString(),
    });

    if (!refreshResponse.ok) {
      await markDisconnected(userId, "Token expirado. El usuario debe reconectar Outlook.");
      throw new ApiError(
        "OUTLOOK_TOKEN_EXPIRED",
        "Token expirado. El usuario debe reconectar Outlook.",
        401
      );
    }

    const tokens = await refreshResponse.json();

    await db.oAuthAccount.update({
      where: { id: oauthAccount.id },
      data: {
        accessToken: tokens.access_token,
        ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    return tokens.access_token as string;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    await markDisconnected(userId, "Token expirado. El usuario debe reconectar Outlook.");
    throw new ApiError(
      "OUTLOOK_TOKEN_EXPIRED",
      "Token expirado. El usuario debe reconectar Outlook.",
      401
    );
  }
}

async function markDisconnected(userId: string, message: string): Promise<void> {
  await db.outlookSyncState.upsert({
    where: { userId },
    create: { userId, syncStatus: "disconnected", lastError: message },
    update: { syncStatus: "disconnected", lastError: message },
  });
}

// ─── Graph API client ────────────────────────────────────────────────────────

export class GraphService {
  private client: Client;

  constructor(accessToken: string) {
    this.client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
  }

  /**
   * Fetch unread emails from inbox
   */
  async getEmails(filter?: string) {
    let request = this.client
      .api("/me/messages")
      .filter("isRead eq false")
      .select("id,subject,bodyPreview,body,from,toRecipients,receivedDateTime,isRead");

    if (filter) {
      request = request.filter(filter);
    }

    return await request.get();
  }

  /**
   * Send email via Microsoft Graph /me/sendMail
   */
  async sendEmail({
    to,
    subject,
    body,
    cc = [],
    bcc = [],
  }: {
    to: string;
    subject: string;
    body: string;
    cc?: string[];
    bcc?: string[];
  }) {
    const message = {
      subject,
      body: {
        contentType: "HTML",
        content: body,
      },
      toRecipients: [{ emailAddress: { address: to } }],
      ccRecipients: cc.map((email) => ({ emailAddress: { address: email } })),
      bccRecipients: bcc.map((email) => ({ emailAddress: { address: email } })),
    };

    return await this.client.api("/me/sendMail").post({ message });
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string) {
    return await this.client
      .api(`/me/messages/${messageId}`)
      .update({ isRead: true });
  }

  /**
   * Delta sync — only fetches changes since last sync.
   * Throws an error with .statusCode preserved so callers can detect 410 Gone
   * (invalid / expired delta token) via isInvalidDeltaError().
   */
  async getDeltaEmails(deltaToken?: string) {
    let url = "/me/mailFolders/inbox/messages/delta";
    if (deltaToken) {
      url += `?$deltatoken=${deltaToken}`;
    }

    try {
      const result = await this.client.api(url).get();
      return {
        emails: result.value ?? [],
        deltaLink: result["@odata.deltaLink"] as string | undefined,
        nextLink: result["@odata.nextLink"] as string | undefined,
      };
    } catch (err: unknown) {
      // Re-throw preserving the Graph SDK's statusCode so isInvalidDeltaError
      // can detect 410 Gone responses.
      const graphError = err as { message?: string; status?: number; statusCode?: number; code?: string };
      if (graphError?.statusCode || graphError?.status) {
        const enriched = new Error(graphError.message ?? "Microsoft Graph error") as Error & {
          status?: number;
          statusCode?: number;
          code?: string;
        };
        enriched.statusCode = graphError.statusCode ?? graphError.status;
        enriched.status = graphError.status ?? graphError.statusCode;
        enriched.code = graphError.code ?? "";
        throw enriched;
      }
      throw err;
    }
  }

  /**
   * Fetch calendar events
   */
  async getCalendarEvents(startDate: Date, endDate: Date) {
    return await this.client
      .api("/me/calendarview")
      .query({
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
      })
      .select("subject,start,end,location,onlineMeeting")
      .get();
  }
}

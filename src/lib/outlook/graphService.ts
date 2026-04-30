import { Client } from "@microsoft/microsoft-graph-client";

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
    bcc = [] 
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
      toRecipients: [
        {
          emailAddress: {
            address: to,
          },
        },
      ],
      ccRecipients: cc.map((email) => ({
        emailAddress: {
          address: email,
        },
      })),
      bccRecipients: bcc.map((email) => ({
        emailAddress: {
          address: email,
        },
      })),
    };

    return await this.client.api("/me/sendMail").post({ message });
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string) {
    return await this.client.api(`/me/messages/${messageId}`).update({
      isRead: true,
    });
  }

  /**
   * Delta sync (only fetch changes since last sync)
   */
  async getDeltaEmails(deltaToken?: string) {
    let url = "/me/mailFolders/inbox/messages/delta";
    if (deltaToken) {
      url += `?$deltatoken=${deltaToken}`;
    }

    const result = await this.client.api(url).get();
    
    // The result contains value[] and either @odata.nextLink or @odata.deltaLink
    return {
      emails: result.value,
      deltaLink: result["@odata.deltaLink"],
      nextLink: result["@odata.nextLink"],
    };
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

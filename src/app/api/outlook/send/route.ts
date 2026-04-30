import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { GraphService } from "@/lib/outlook/graphService";
import { emailSchema } from "@/lib/validations/email";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);
    }

    const body = await req.json();
    const validatedData = emailSchema.parse(body);

    // 1. Get access token
    const oauthAccount = await db.oAuthAccount.findFirst({
      where: { 
        userId: session.user.id, 
        provider: "microsoft-entra-id" 
      },
    });

    if (!oauthAccount || !oauthAccount.accessToken) {
      throw new ApiError("FORBIDDEN", "Outlook not connected", 403);
    }

    // 2. Send via Graph
    const graph = new GraphService(oauthAccount.accessToken);
    const sendResult = await graph.sendEmail({
      to: validatedData.to,
      subject: validatedData.subject,
      body: validatedData.body,
      cc: validatedData.cc,
      bcc: validatedData.bcc,
    });

    // 3. Create communication record
    const communication = await db.communication.create({
      data: {
        applicationId: validatedData.application_id,
        type: "email",
        subject: validatedData.subject,
        body: validatedData.body,
        sentBy: session.user.id,
        sentAt: new Date(),
        emailTo: validatedData.to,
        emailFrom: session.user.email || "",
        emailCc: validatedData.cc || [],
        emailBcc: validatedData.bcc || [],
        isOutbound: true,
        templateId: validatedData.template_id,
      },
    });

    // 4. Update application last contact
    await db.application.update({
      where: { id: validatedData.application_id },
      data: {
        lastContactAt: new Date(),
        lastContactedBy: session.user.id,
      },
    });

    return apiResponse({
      communication_id: communication.id,
      sent_at: communication.sentAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { emailTemplateSchema } from "@/lib/validations/email";
import { NextRequest } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);

    const body = await req.json();
    const validatedData = emailTemplateSchema.parse(body);

    const template = await db.emailTemplate.update({
      where: { id: params.id },
      data: validatedData,
    });

    return apiResponse(template);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);

    const template = await db.emailTemplate.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return apiResponse({ success: true, id: template.id });
  } catch (error) {
    return handleApiError(error);
  }
}

import { db } from "@/lib/db";
import { apiResponse, handleApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { validateId } from "@/lib/params";
import { emailTemplateSchema } from "@/lib/validations/email";
import { NextRequest } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { valid, response } = validateId(params.id);
  if (!valid) return response!;

  try {
    const { errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

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
  const { valid, response } = validateId(params.id);
  if (!valid) return response!;

  try {
    const { errorResponse } = await requireRole("admin");
    if (errorResponse) return errorResponse;

    const template = await db.emailTemplate.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return apiResponse({ success: true, id: template.id });
  } catch (error) {
    return handleApiError(error);
  }
}

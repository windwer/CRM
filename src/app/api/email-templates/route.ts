import { auth } from "../../../../auth";
import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { emailTemplateSchema } from "@/lib/validations/email";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);

    const templates = await db.emailTemplate.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return apiResponse(templates);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);
    }

    const body = await req.json();
    const validatedData = emailTemplateSchema.parse(body);

    const template = await db.emailTemplate.create({
      data: {
        ...validatedData,
        createdBy: session.user.id,
      },
    });

    return apiResponse(template);
  } catch (error) {
    return handleApiError(error);
  }
}

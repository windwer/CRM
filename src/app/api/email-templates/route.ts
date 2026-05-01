import { db } from "@/lib/db";
import { apiResponse, handleApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { parsePagination, buildMeta } from "@/lib/pagination";
import { emailTemplateSchema } from "@/lib/validations/email";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = await requireRole("viewer");
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const { page, limit, skip, take } = parsePagination(searchParams);

    const where = { isActive: true };

    const [templates, total] = await db.$transaction([
      db.emailTemplate.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      db.emailTemplate.count({ where }),
    ]);

    return apiResponse(templates, buildMeta(total, page, limit));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

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

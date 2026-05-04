import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiResponse, handleApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { parsePagination, buildMeta } from "@/lib/pagination";
import { UserRole } from "@antigravity/database";
import { z } from "zod";

const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(UserRole).default("viewer"),
  name: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;
    const { page, limit, skip, take } = parsePagination(
      new URL(req.url).searchParams
    );

    const where =
      session.user.role === "admin"
        ? {}
        : { role: { in: [UserRole.recruiter, UserRole.admin] }, isActive: true };

    const [users, total] = await db.$transaction([
      db.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
      db.user.count({ where }),
    ]);

    return apiResponse(users, buildMeta(total, page, limit));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = await requireRole("admin");
    if (errorResponse) return errorResponse;

    const body = inviteUserSchema.parse(await req.json());
    const user = await db.user.create({
      data: {
        email: body.email,
        name: body.name || body.email.split("@")[0],
        role: body.role,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return apiResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}

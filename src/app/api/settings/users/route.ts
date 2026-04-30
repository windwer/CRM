import { NextRequest } from "next/server";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { UserRole } from "@antigravity/database";
import { z } from "zod";

const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(UserRole).default("viewer"),
  name: z.string().optional(),
});

async function assertAdmin() {
  const session = await auth();
  if (!session) throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);
  if (session.user?.role !== "admin") {
    throw new ApiError("FORBIDDEN", "Only admins can manage users", 403);
  }
  return session;
}

export async function GET() {
  try {
    await assertAdmin();

    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return apiResponse(users);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await assertAdmin();

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


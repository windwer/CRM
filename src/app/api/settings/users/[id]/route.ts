import { NextRequest } from "next/server";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { UserRole } from "@antigravity/database";
import { z } from "zod";

const updateUserSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
});

async function assertAdmin() {
  const session = await auth();
  if (!session) throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);
  if (session.user?.role !== "admin") {
    throw new ApiError("FORBIDDEN", "Only admins can manage users", 403);
  }
  return session;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdmin();

    const body = updateUserSchema.parse(await req.json());
    const user = await db.user.update({
      where: { id: params.id },
      data: {
        ...(body.role ? { role: body.role } : {}),
        ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
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


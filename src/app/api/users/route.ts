import { db } from "@/lib/db";
import { apiResponse, handleApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const { errorResponse } = await requireRole("viewer");
    if (errorResponse) return errorResponse;

    const users = await db.user.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true },
    });

    return apiResponse(users);
  } catch (error) {
    return handleApiError(error);
  }
}

import { auth } from "../../../../auth";
import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);

    if (session.user.role !== "admin") {
      throw new ApiError("FORBIDDEN", "Only admins can manage GDPR queue", 403);
    }

    const pending = await db.gDPRDeletionQueue.findMany({
      where: { status: "pending" },
      include: {
        candidate: {
          select: { fullName: true, email: true },
        },
      },
      orderBy: { deletionDate: "asc" },
    });

    return apiResponse(pending);
  } catch (error) {
    return handleApiError(error);
  }
}

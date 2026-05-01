import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiResponse, ApiError, handleApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { validateId } from "@/lib/params";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { valid, response } = validateId(params.id);
  if (!valid) return response!;

  try {
    const { session, errorResponse } = await requireRole("admin");
    if (errorResponse) return errorResponse;

    const result = await db.$transaction(async (tx) => {
      const [current, target] = await Promise.all([
        tx.ai_provider_config.findFirst({ where: { is_active: true } }),
        tx.ai_provider_config.findUnique({ where: { id: params.id } }),
      ]);

      if (!target) {
        throw new ApiError("AI_PROVIDER_NOT_FOUND", "Provider not found", 404);
      }

      if (!target.api_key) {
        throw new ApiError(
          "AI_PROVIDER_NO_API_KEY",
          "This provider does not have an API key configured",
          400
        );
      }

      await tx.ai_provider_config.updateMany({
        where: { is_active: true },
        data: { is_active: false, updated_by: session.user.id },
      });

      const activated = await tx.ai_provider_config.update({
        where: { id: params.id },
        data: { is_active: true, updated_by: session.user.id },
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "ai_provider_changed",
          entityType: "ai_provider_config",
          entityId: activated.id,
          details: {
            deactivated: current?.provider ?? null,
            activated: activated.provider,
          },
        },
      });

      return {
        activated: activated.provider,
        deactivated: current?.provider ?? null,
      };
    });

    return apiResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

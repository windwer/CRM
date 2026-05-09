import { NextRequest } from "next/server";
import { AIProvider as PrismaAIProvider } from "@smartcrm/database";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiResponse, ApiError, handleApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { validateId } from "@/lib/params";
import { decryptApiKey, encryptApiKey, maskApiKey } from "@/lib/crypto";

const updateProviderSchema = z.object({
  api_key: z.string().min(10).optional(),
  model: z.string().min(1).optional(),
  display_name: z.string().min(1).optional(),
});

function serializeProvider(provider: {
  id: string;
  provider: PrismaAIProvider;
  api_key: string;
  model: string;
  is_active: boolean;
  display_name: string;
  created_at: Date;
  updated_at: Date;
}) {
  let maskedApiKey: string | null = null;

  if (provider.api_key) {
    try {
      maskedApiKey = maskApiKey(decryptApiKey(provider.api_key));
    } catch {
      maskedApiKey = "••••••••••••";
    }
  }

  return {
    id: provider.id,
    provider: provider.provider,
    model: provider.model,
    is_active: provider.is_active,
    display_name: provider.display_name,
    api_key_masked: maskedApiKey,
    has_api_key: Boolean(provider.api_key),
    created_at: provider.created_at,
    updated_at: provider.updated_at,
  };
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { valid, response } = validateId(params.id);
  if (!valid) return response!;

  try {
    const { session, errorResponse } = await requireRole("admin");
    if (errorResponse) return errorResponse;
    const body = updateProviderSchema.parse(await req.json());

    const provider = await db.ai_provider_config.update({
      where: { id: params.id },
      data: {
        ...(body.api_key ? { api_key: encryptApiKey(body.api_key) } : {}),
        ...(body.model ? { model: body.model } : {}),
        ...(body.display_name ? { display_name: body.display_name } : {}),
        updated_by: session.user.id,
      },
    });

    return apiResponse(serializeProvider(provider));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { valid, response } = validateId(params.id);
  if (!valid) return response!;

  try {
    const { errorResponse } = await requireRole("admin");
    if (errorResponse) return errorResponse;
    const provider = await db.ai_provider_config.findUnique({ where: { id: params.id } });

    if (!provider) {
      throw new ApiError("AI_PROVIDER_NOT_FOUND", "Provider not found", 404);
    }

    if (provider.is_active) {
      throw new ApiError(
        "AI_PROVIDER_ACTIVE",
        "No puedes eliminar el proveedor de IA activo.",
        400
      );
    }

    await db.ai_provider_config.delete({ where: { id: params.id } });

    return apiResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}

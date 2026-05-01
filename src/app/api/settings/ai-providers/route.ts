import { NextRequest } from "next/server";
import { AIProvider as PrismaAIProvider } from "@antigravity/database";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiResponse, ApiError, handleApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { decryptApiKey, encryptApiKey, maskApiKey } from "@/lib/crypto";

const createProviderSchema = z.object({
  provider: z.nativeEnum(PrismaAIProvider),
  api_key: z.string().min(10),
  model: z.string().min(1),
  display_name: z.string().min(1),
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

export async function GET() {
  try {
    const { errorResponse } = await requireRole("admin");
    if (errorResponse) return errorResponse;

    const providers = await db.ai_provider_config.findMany({
      take: 10,
      orderBy: [{ provider: "asc" }],
    });

    return apiResponse(providers.map(serializeProvider));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireRole("admin");
    if (errorResponse) return errorResponse;
    const body = createProviderSchema.parse(await req.json());

    const existing = await db.ai_provider_config.findUnique({
      where: { provider: body.provider },
    });

    if (existing) {
      throw new ApiError("AI_PROVIDER_EXISTS", "Provider already configured", 409);
    }

    const provider = await db.ai_provider_config.create({
      data: {
        provider: body.provider,
        api_key: encryptApiKey(body.api_key),
        model: body.model,
        display_name: body.display_name,
        is_active: false,
        created_by: session.user.id,
        updated_by: session.user.id,
      },
    });

    return apiResponse(serializeProvider(provider));
  } catch (error) {
    return handleApiError(error);
  }
}

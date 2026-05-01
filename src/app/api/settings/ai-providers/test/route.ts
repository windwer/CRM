import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { z } from "zod";
import { db } from "@/lib/db";
import { decryptApiKey } from "@/lib/crypto";
import { apiResponse, ApiError, handleApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";

const testProviderSchema = z.object({
  provider_id: z.string().uuid(),
});

async function withTenSecondTimeout<T>(operation: (signal: AbortSignal) => Promise<T>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    return await Promise.race([
      operation(controller.signal),
      new Promise<T>((_, reject) => {
        controller.signal.addEventListener("abort", () =>
          reject(new Error("AI_TEST_TIMEOUT"))
        );
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = await requireRole("admin");
    if (errorResponse) return errorResponse;
    const { provider_id } = testProviderSchema.parse(await req.json());
    const config = await db.ai_provider_config.findUnique({
      where: { id: provider_id },
    });

    if (!config) {
      throw new ApiError("AI_PROVIDER_NOT_FOUND", "Provider not found", 404);
    }

    if (!config.api_key) {
      throw new ApiError("AI_PROVIDER_NO_API_KEY", "API key is not configured", 400);
    }

    const apiKey = decryptApiKey(config.api_key);
    const startedAt = Date.now();

    try {
      if (config.provider === "anthropic") {
        const client = new Anthropic({ apiKey });
        await withTenSecondTimeout((signal) =>
          client.messages.create(
            {
              model: config.model,
              max_tokens: 16,
              messages: [{ role: "user", content: "Respond with the word OK" }],
            },
            { signal }
          )
        );
      }

      if (config.provider === "openai") {
        const client = new OpenAI({ apiKey });
        await withTenSecondTimeout((signal) =>
          client.chat.completions.create(
            {
              model: config.model,
              messages: [{ role: "user", content: "Respond with the word OK" }],
            },
            { signal }
          )
        );
      }

      if (config.provider === "gemini") {
        const client = new GoogleGenerativeAI(apiKey);
        const model = client.getGenerativeModel({ model: config.model });
        await withTenSecondTimeout(() =>
          model.generateContent("Respond with the word OK")
        );
      }

      return apiResponse({ status: "ok", latency_ms: Date.now() - startedAt });
    } catch (error) {
      return handleApiError(
        new ApiError(
          "AI_TEST_FAILED",
          error instanceof Error ? error.message : "AI provider test failed",
          400
        )
      );
    }
  } catch (error) {
    return handleApiError(error);
  }
}

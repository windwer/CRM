import { db } from "@/lib/db";
import { decryptApiKey } from "@/lib/crypto";
import { AnthropicProvider } from "./anthropic";
import { GeminiProvider } from "./gemini";
import { OpenAIProvider } from "./openai";
import type { AIProvider } from "./types";

type ProviderName = "anthropic" | "openai" | "gemini";

export function createAIProvider(
  provider: ProviderName,
  apiKey: string,
  model: string
): AIProvider {
  switch (provider) {
    case "anthropic":
      return new AnthropicProvider(apiKey, model);
    case "openai":
      return new OpenAIProvider(apiKey, model);
    case "gemini":
      return new GeminiProvider(apiKey, model);
    default:
      throw new Error("AI_PROVIDER_UNKNOWN");
  }
}

export async function getActiveAIProvider(): Promise<AIProvider> {
  const config = await db.ai_provider_config.findFirst({
    where: { is_active: true },
  });

  if (!config) {
    const fallbackKey = process.env.ANTHROPIC_API_KEY;
    if (fallbackKey) {
      console.warn(
        "Usando ANTHROPIC_API_KEY de .env como fallback. Configura un proveedor en Settings > Integraciones para producción."
      );
      return new AnthropicProvider(fallbackKey, "claude-sonnet-4-5");
    }

    throw new Error("NO_ACTIVE_AI_PROVIDER");
  }

  if (!config.api_key) {
    throw new Error("AI_PROVIDER_NO_API_KEY");
  }

  return createAIProvider(
    config.provider,
    decryptApiKey(config.api_key),
    config.model
  );
}

export type { AIProvider, ParsedCV, ScoreResult } from "./types";

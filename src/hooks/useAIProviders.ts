"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export type AIProviderName = "anthropic" | "openai" | "gemini";

export type AIProviderConfig = {
  id: string;
  provider: AIProviderName;
  model: string;
  is_active: boolean;
  display_name: string;
  api_key_masked: string | null;
  has_api_key: boolean;
  created_at: string;
  updated_at: string;
};

type SaveAIProviderInput = {
  id?: string;
  provider: AIProviderName;
  api_key?: string;
  model: string;
  display_name: string;
};

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export function useAIProviders() {
  return useQuery({
    queryKey: ["settings-ai-providers"],
    queryFn: async () =>
      unwrap<AIProviderConfig[]>(
        await axios.get("/api/settings/ai-providers")
      ),
  });
}

export function useSaveAIProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SaveAIProviderInput) => {
      const body = {
        provider: payload.provider,
        model: payload.model,
        display_name: payload.display_name,
        ...(payload.api_key ? { api_key: payload.api_key } : {}),
      };

      if (payload.id) {
        return unwrap<AIProviderConfig>(
          await axios.put(`/api/settings/ai-providers/${payload.id}`, body)
        );
      }

      return unwrap<AIProviderConfig>(
        await axios.post("/api/settings/ai-providers", {
          ...body,
          api_key: payload.api_key,
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-ai-providers"] });
    },
  });
}

export function useActivateAIProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) =>
      unwrap<{ activated: AIProviderName; deactivated: AIProviderName | null }>(
        await axios.post(`/api/settings/ai-providers/${id}/activate`)
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-ai-providers"] });
    },
  });
}

export function useTestAIProvider() {
  return useMutation({
    mutationFn: async (providerId: string) =>
      unwrap<{ status: "ok"; latency_ms: number }>(
        await axios.post("/api/settings/ai-providers/test", {
          provider_id: providerId,
        })
      ),
  });
}

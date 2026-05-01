import type {
  ParsedCV as ValidatedParsedCV,
  ScoreResult as ValidatedScoreResult,
} from "@/lib/validations/ai";

export type ParsedCV = ValidatedParsedCV;
export type ScoreResult = ValidatedScoreResult;
export type ExperienceItem = ParsedCV["experience"][number];
export type EducationItem = ParsedCV["education"][number];

export interface AIProvider {
  parseCV(fileBase64: string, mimeType: string): Promise<ParsedCV>;
  scoreCandidate(candidateId: string, offerId: string): Promise<ScoreResult>;
  getProviderName(): string;
  getModelName(): string;
}

type RetryableError = Error & {
  status?: number;
  statusCode?: number;
  code?: string;
};

export function extractJson(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI_JSON_NOT_FOUND");
  }

  return cleaned.slice(start, end + 1);
}

export function normalizeScorePayload(payload: Record<string, unknown>) {
  return {
    ...payload,
    matched_required_skills:
      payload.matched_required_skills ?? payload.matched_skills ?? [],
    missing_required_skills:
      payload.missing_required_skills ?? payload.missing_skills ?? [],
    matched_nice_to_have: payload.matched_nice_to_have ?? [],
  };
}

export function isRetryableAIError(error: unknown) {
  const status = (error as RetryableError)?.status ?? (error as RetryableError)?.statusCode;
  const code = (error as RetryableError)?.code;

  return status === 429 || (typeof status === "number" && status >= 500) || code === "ETIMEDOUT";
}

export async function withTimeoutAndRetry<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  retries = 2,
  timeoutMs = 60_000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await Promise.race([
        operation(controller.signal),
        new Promise<T>((_, reject) => {
          controller.signal.addEventListener("abort", () => {
            reject(new Error("AI_REQUEST_TIMEOUT"));
          });
        }),
      ]);
    } catch (error) {
      lastError = error;
      if (attempt >= retries || !isRetryableAIError(error)) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 2_000 * (attempt + 1)));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("AI_PROVIDER_FAILED");
}

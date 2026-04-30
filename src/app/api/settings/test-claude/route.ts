import Anthropic from "@anthropic-ai/sdk";
import { auth } from "../../../../../auth";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session) throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);
    if (session.user?.role !== "admin") {
      throw new ApiError("FORBIDDEN", "Only admins can test integrations", 403);
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return apiResponse({ configured: false, ok: false, error: "ANTHROPIC_API_KEY is not configured" });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 8,
      messages: [{ role: "user", content: "Reply with ok." }],
    });

    return apiResponse({ configured: true, ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}


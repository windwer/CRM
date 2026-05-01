import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { CV_PARSING_PROMPT, SCORING_PROMPT } from "@/lib/ai/prompts";
import { parsedCVSchema, scoreResultSchema } from "@/lib/validations/ai";
import {
  AIProvider,
  ParsedCV,
  ScoreResult,
  extractJson,
  normalizeScorePayload,
  withTimeoutAndRetry,
} from "./types";

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;

  constructor(
    private apiKey: string,
    private model: string
  ) {
    this.client = new Anthropic({ apiKey });
  }

  getProviderName() {
    return "anthropic";
  }

  getModelName() {
    return this.model;
  }

  async parseCV(fileBase64: string, mimeType: string): Promise<ParsedCV> {
    const response = await withTimeoutAndRetry((signal) =>
      this.client.messages.create(
        {
          model: this.model,
          max_tokens: 4096,
          system: CV_PARSING_PROMPT,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: mimeType === "application/pdf" ? "document" : "image",
                  source: {
                    type: "base64",
                    media_type: mimeType,
                    data: fileBase64,
                  },
                },
                { type: "text", text: "Extract information from this CV." },
              ] as Anthropic.Messages.MessageParam["content"],
            },
          ],
        },
        { signal }
      )
    );

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    return parsedCVSchema.parse(JSON.parse(extractJson(text)));
  }

  async scoreCandidate(candidateId: string, offerId: string): Promise<ScoreResult> {
    const { candidate, offer } = await getCandidateOffer(candidateId, offerId);
    const prompt = SCORING_PROMPT.replace(
      "{candidate_data}",
      JSON.stringify(candidate, null, 2)
    ).replace("{offer_data}", JSON.stringify(offer, null, 2));

    const response = await withTimeoutAndRetry((signal) =>
      this.client.messages.create(
        {
          model: this.model,
          max_tokens: 2048,
          system: "You are an expert talent advisor. Return only valid JSON.",
          messages: [{ role: "user", content: prompt }],
        },
        { signal }
      )
    );

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
    const payload = normalizeScorePayload(JSON.parse(extractJson(text)));

    return scoreResultSchema.parse(payload);
  }
}

async function getCandidateOffer(candidateId: string, offerId: string) {
  const [candidate, offer] = await Promise.all([
    db.candidate.findUnique({
      where: { id: candidateId },
      select: {
        fullName: true,
        skillsArray: true,
        experienceYears: true,
        seniorityLevel: true,
        parsedData: true,
      },
    }),
    db.offer.findUnique({
      where: { id: offerId },
      select: {
        title: true,
        description: true,
        requirements: true,
        department: true,
        location: true,
        jobType: true,
      },
    }),
  ]);

  if (!candidate || !offer) {
    throw new Error("CANDIDATE_OR_OFFER_NOT_FOUND");
  }

  return { candidate, offer };
}

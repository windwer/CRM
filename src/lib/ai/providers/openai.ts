import OpenAI from "openai";
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

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(
    private apiKey: string,
    private model: string
  ) {
    this.client = new OpenAI({ apiKey });
  }

  getProviderName() {
    return "openai";
  }

  getModelName() {
    return this.model;
  }

  async parseCV(fileBase64: string, mimeType: string): Promise<ParsedCV> {
    const response = await withTimeoutAndRetry((signal) =>
      this.client.chat.completions.create(
        {
          model: this.model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: CV_PARSING_PROMPT },
            {
              role: "user",
              content:
                `Extract information from this CV. MIME type: ${mimeType}.\n` +
                `The file content is base64 encoded:\n${fileBase64}`,
            },
          ],
        },
        { signal }
      )
    );

    const text = response.choices[0]?.message.content ?? "";
    return parsedCVSchema.parse(JSON.parse(extractJson(text)));
  }

  async scoreCandidate(candidateId: string, offerId: string): Promise<ScoreResult> {
    const { candidate, offer } = await getCandidateOffer(candidateId, offerId);
    const prompt = SCORING_PROMPT.replace(
      "{candidate_data}",
      JSON.stringify(candidate, null, 2)
    ).replace("{offer_data}", JSON.stringify(offer, null, 2));

    const response = await withTimeoutAndRetry((signal) =>
      this.client.chat.completions.create(
        {
          model: this.model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "Return only valid JSON." },
            { role: "user", content: prompt },
          ],
        },
        { signal }
      )
    );

    const text = response.choices[0]?.message.content ?? "";
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
        mustHaves: true,
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

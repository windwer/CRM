import { GoogleGenerativeAI } from "@google/generative-ai";
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

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;

  constructor(
    private apiKey: string,
    private model: string
  ) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  getProviderName() {
    return "gemini";
  }

  getModelName() {
    return this.model;
  }

  async parseCV(fileBase64: string, mimeType: string): Promise<ParsedCV> {
    const model = this.client.getGenerativeModel({
      model: this.model,
      generationConfig: { responseMimeType: "application/json" },
    });

    const response = await withTimeoutAndRetry(() =>
      model.generateContent([
        { text: CV_PARSING_PROMPT },
        { inlineData: { mimeType, data: fileBase64 } },
      ])
    );

    return parsedCVSchema.parse(JSON.parse(extractJson(response.response.text())));
  }

  async scoreCandidate(candidateId: string, offerId: string): Promise<ScoreResult> {
    const { candidate, offer } = await getCandidateOffer(candidateId, offerId);
    const prompt = SCORING_PROMPT.replace(
      "{candidate_data}",
      JSON.stringify(candidate, null, 2)
    ).replace("{offer_data}", JSON.stringify(offer, null, 2));
    const model = this.client.getGenerativeModel({
      model: this.model,
      generationConfig: { responseMimeType: "application/json" },
    });

    const response = await withTimeoutAndRetry(() => model.generateContent(prompt));
    const payload = normalizeScorePayload(JSON.parse(extractJson(response.response.text())));

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

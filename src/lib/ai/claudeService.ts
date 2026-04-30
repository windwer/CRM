import Anthropic from "@anthropic-ai/sdk";
import { db } from "../db";
import { CV_PARSING_PROMPT, SCORING_PROMPT } from "./prompts";
import { parsedCVSchema, scoreResultSchema, type ParsedCV, type ScoreResult } from "../validations/ai";
import logger from "../logger";
import { ApiError } from "../errors";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Parses a CV PDF from base64 using Claude Vision.
 */
export async function parseCV(fileBase64: string, mimeType: string, candidateId?: string): Promise<ParsedCV> {
  try {
    const isPdf = mimeType === "application/pdf";
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 4096,
      system: CV_PARSING_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: isPdf ? "document" : "image",
              source: {
                type: "base64",
                media_type: mimeType as any,
                data: fileBase64,
              },
            } as any,
            {
              type: "text",
              text: "Extract information from this CV.",
            },
          ],
        },
      ],
    });

    let content = response.content[0].type === "text" ? response.content[0].text : "";
    
    // Clean up markdown code blocks if present
    if (content.includes("```json")) {
      content = content.split("```json")[1].split("```")[0].trim();
    } else if (content.includes("```")) {
      content = content.split("```")[1].split("```")[0].trim();
    }

    const parsedData = JSON.parse(content);
    const validatedData = parsedCVSchema.parse(parsedData);

    // Log tokens and cost
    const cost = calculateCost("claude-3-5-sonnet-latest", response.usage.input_tokens, response.usage.output_tokens);
    
    await db.aIProcessingLog.create({
      data: {
        candidateId,
        processingType: "cv_parsing",
        modelUsed: "claude-3-5-sonnet-latest",
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        cost,
        requestData: { mimeType },
        responseData: validatedData as any,
        status: "success",
        completedAt: new Date(),
      },
    });

    return validatedData;
  } catch (error) {
    logger.error("Error parsing CV with Claude", { error });
    
    if (candidateId) {
      await db.aIProcessingLog.create({
        data: {
          candidateId,
          processingType: "cv_parsing",
          status: "error",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
    
    throw new ApiError("AI_ERROR", "Failed to parse CV with AI", 500);
  }
}

/**
 * Scores a candidate against a specific job offer.
 */
export async function scoreCandidate(candidateId: string, offerId: string, applicationId?: string): Promise<ScoreResult> {
  try {
    const [candidate, offer] = await Promise.all([
      db.candidate.findUnique({ where: { id: candidateId } }),
      db.offer.findUnique({ where: { id: offerId } }),
    ]);

    if (!candidate || !offer) {
      throw new ApiError("NOT_FOUND", "Candidate or Offer not found", 404);
    }

    const prompt = SCORING_PROMPT
      .replace("{candidate_data}", JSON.stringify(candidate.parsedData || candidate))
      .replace("{offer_data}", JSON.stringify(offer));

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    let content = response.content[0].type === "text" ? response.content[0].text : "";
    
    // Clean up markdown code blocks if present
    if (content.includes("```json")) {
      content = content.split("```json")[1].split("```")[0].trim();
    } else if (content.includes("```")) {
      content = content.split("```")[1].split("```")[0].trim();
    }

    const scoreData = JSON.parse(content);
    const validatedScore = scoreResultSchema.parse(scoreData);
    const scoreDetails = {
      matched_skills: [
        ...validatedScore.matched_required_skills,
        ...validatedScore.matched_nice_to_have,
      ],
      missing_skills: validatedScore.missing_required_skills,
      strengths: validatedScore.strengths,
      gaps: validatedScore.gaps,
      recommendation: validatedScore.recommendation,
      score_breakdown: validatedScore.score_breakdown,
      raw: validatedScore,
    };

    const cost = calculateCost("claude-3-5-sonnet-latest", response.usage.input_tokens, response.usage.output_tokens);

    await db.$transaction([
      db.aIProcessingLog.create({
        data: {
          candidateId,
          applicationId,
          processingType: "matching",
          modelUsed: "claude-3-5-sonnet-latest",
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
          cost,
          responseData: validatedScore as any,
          status: "success",
          completedAt: new Date(),
        },
      }),
      // Update application if ID provided
      ...(applicationId ? [
        db.application.update({
          where: { id: applicationId },
          data: {
            aiScore: validatedScore.overall_score,
            aiExplanation: validatedScore.summary,
            aiScoreDetails: scoreDetails as any,
            aiScoringAt: new Date(),
          },
        })
      ] : []),
    ]);

    return validatedScore;
  } catch (error) {
    logger.error("Error scoring candidate with Claude", { error });
    throw new ApiError("AI_ERROR", "Failed to score candidate with AI", 500);
  }
}

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  // Prices per 1M tokens (Sonnet 3.5)
  // Input: $3.00, Output: $15.00
  const inputCost = (inputTokens / 1_000_000) * 3.0;
  const outputCost = (outputTokens / 1_000_000) * 15.0;
  return inputCost + outputCost;
}

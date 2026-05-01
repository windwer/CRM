import { AIProcessingStatus, Prisma } from "@antigravity/database";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import logger from "@/lib/logger";
import type { ParsedCV, ScoreResult } from "@/lib/validations/ai";
import { getActiveAIProvider } from "./providers";

export async function parseCV(
  fileBase64: string,
  mimeType: string,
  candidateId?: string
): Promise<ParsedCV> {
  const provider = await getActiveAIProvider();

  try {
    const parsedData = await provider.parseCV(fileBase64, mimeType);

    await db.aIProcessingLog.create({
      data: {
        candidateId,
        processingType: "cv_parsing",
        modelUsed: `${provider.getProviderName()}:${provider.getModelName()}`,
        requestData: {
          provider: provider.getProviderName(),
          model: provider.getModelName(),
          mimeType,
          fileSize: fileBase64.length,
        },
        responseData: parsedData as Prisma.InputJsonValue,
        status: AIProcessingStatus.success,
        completedAt: new Date(),
      },
    });

    return parsedData;
  } catch (error) {
    logger.error("CV parsing failed", {
      err: error,
      provider: provider.getProviderName(),
      model: provider.getModelName(),
    });

    await db.aIProcessingLog.create({
      data: {
        candidateId,
        processingType: "cv_parsing",
        modelUsed: `${provider.getProviderName()}:${provider.getModelName()}`,
        requestData: {
          provider: provider.getProviderName(),
          model: provider.getModelName(),
          mimeType,
        },
        status: AIProcessingStatus.error,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      },
    });

    throw new ApiError("AI_PARSING_FAILED", "Failed to parse CV", 500);
  }
}

export async function scoreCandidate(
  candidateId: string,
  offerId: string,
  applicationId?: string
): Promise<ScoreResult> {
  const provider = await getActiveAIProvider();

  try {
    const score = await provider.scoreCandidate(candidateId, offerId);
    const scoreDetails = {
      matched_skills: score.matched_required_skills,
      missing_skills: score.missing_required_skills,
      strengths: score.strengths,
      gaps: score.gaps,
      recommendation: score.recommendation,
      score_breakdown: score.score_breakdown,
      matched_nice_to_have: score.matched_nice_to_have,
      provider: provider.getProviderName(),
      model: provider.getModelName(),
    };

    await db.$transaction([
      db.aIProcessingLog.create({
        data: {
          candidateId,
          applicationId,
          processingType: "matching",
          modelUsed: `${provider.getProviderName()}:${provider.getModelName()}`,
          requestData: {
            provider: provider.getProviderName(),
            model: provider.getModelName(),
            candidateId,
            offerId,
          },
          responseData: scoreDetails as Prisma.InputJsonValue,
          status: AIProcessingStatus.success,
          completedAt: new Date(),
        },
      }),
      ...(applicationId
        ? [
            db.application.update({
              where: { id: applicationId },
              data: {
                aiScore: score.overall_score,
                aiExplanation: score.summary,
                aiScoreDetails: scoreDetails,
              },
            }),
          ]
        : []),
    ]);

    return score;
  } catch (error) {
    logger.error("Candidate scoring failed", {
      err: error,
      provider: provider.getProviderName(),
      model: provider.getModelName(),
    });

    await db.aIProcessingLog.create({
      data: {
        candidateId,
        applicationId,
        processingType: "matching",
        modelUsed: `${provider.getProviderName()}:${provider.getModelName()}`,
        requestData: {
          provider: provider.getProviderName(),
          model: provider.getModelName(),
          candidateId,
          offerId,
        },
        status: AIProcessingStatus.error,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      },
    });

    throw new ApiError("AI_SCORING_FAILED", "Failed to score candidate", 500);
  }
}

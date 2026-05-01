import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { getBlob } from "@/lib/azure/blobService";
import { parseCV } from "@/lib/ai/claudeService";
import logger from "@/lib/logger";
import { NextRequest } from "next/server";
import { parseCVSchema } from "@/lib/validations/ai";

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

    const validation = parseCVSchema.safeParse(await req.json());
    if (!validation.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        validation.error.issues[0]?.message ?? "Invalid request body",
        400
      );
    }
    const { candidateId, blobId } = validation.data;

    // 1. Fetch PDF from Azure Blob
    const buffer = await getBlob(blobId);
    const base64 = buffer.toString("base64");

    // 2. Call Claude to parse
    const parsedData = await parseCV(base64, "application/pdf", candidateId);

    // 3. Update candidate
    const candidate = await db.candidate.update({
      where: { id: candidateId },
      data: {
        parsedData: parsedData as any,
        skillsArray: parsedData.skills || [],
        experienceYears: parsedData.total_years_experience || 0,
        seniorityLevel: parsedData.seniority_level || "mid",
        cvParsedAt: new Date(),
      },
    });

    logger.info("CV parsed and candidate updated", { candidateId });

    return apiResponse({
      parsedData,
      candidateId: candidate.id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

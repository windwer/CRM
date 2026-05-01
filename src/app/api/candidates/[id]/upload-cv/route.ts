import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { validateId } from "@/lib/params";
import { uploadBlob } from "@/lib/azure/blobService";
import logger from "@/lib/logger";
import { NextRequest } from "next/server";
import { uploadCVSchema, validateCVFile } from "@/lib/validations/upload";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { valid, response } = validateId(params.id);
  if (!valid) return response!;

  try {
    const { errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

    const formData = await req.formData();
    const metadataValidation = uploadCVSchema.safeParse({
      candidateId: formData.get("candidate_id") ?? params.id,
    });
    if (!metadataValidation.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        metadataValidation.error.issues[0]?.message ?? "Invalid upload metadata",
        400
      );
    }
    const file = formData.get("file") as File;

    if (!file) throw new ApiError("BAD_REQUEST", "No file uploaded", 400);
    const fileValidation = validateCVFile(file);
    if (!fileValidation.valid) {
      throw new ApiError("BAD_REQUEST", fileValidation.error ?? "Invalid file", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const blobId = await uploadBlob(buffer, file.name);

    const candidate = await db.candidate.update({
      where: { id: params.id },
      data: {
        cvBlobId: blobId,
        updatedAt: new Date(),
      },
    });

    logger.info("CV uploaded for candidate", { candidateId: params.id, blobId });

    return apiResponse({
      blobId,
      candidateId: candidate.id,
      fileName: file.name,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

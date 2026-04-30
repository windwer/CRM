import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { uploadBlob } from "@/lib/azure/blobService";
import logger from "@/lib/logger";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) throw new ApiError("BAD_REQUEST", "No file uploaded", 400);
    if (file.type !== "application/pdf") throw new ApiError("BAD_REQUEST", "Only PDF files are allowed", 400);
    if (file.size > 5 * 1024 * 1024) throw new ApiError("BAD_REQUEST", "File size exceeds 5MB limit", 400);

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

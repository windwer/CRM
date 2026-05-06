import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { parsePagination, buildMeta } from "@/lib/pagination";
import { candidateSchema } from "@/lib/validations/candidate";
import logger from "@/lib/logger";
import { NextRequest } from "next/server";
import { Prisma } from "@antigravity/database";

function getDuplicateField(error: Prisma.PrismaClientKnownRequestError) {
  const target = error.meta?.target;
  if (Array.isArray(target)) return String(target[0] ?? "campo");
  if (typeof target === "string") return target;
  return "campo";
}

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = await requireRole("viewer");
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("archived") === "true";
    const { page, limit, skip, take } = parsePagination(searchParams);

    const where = includeArchived ? {} : { archivedAt: null };

    const [candidates, total] = await db.$transaction([
      db.candidate.findMany({
        where,
        include: {
          applications: {
            select: {
              pipelineStage: { select: { slug: true } },
              offer: { select: { status: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      db.candidate.count({ where }),
    ]);

    return apiResponse(candidates, buildMeta(total, page, limit));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = getDuplicateField(error);
      return handleApiError(
        new ApiError(
          "CONFLICT",
          target === "email" ? "Email ya existe en el sistema" : `Valor duplicado en ${target}`,
          409
        )
      );
    }

    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const validation = candidateSchema.safeParse(body);
    if (!validation.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        validation.error.issues[0]?.message || "Datos del candidato invalidos",
        400
      );
    }
    const validatedData = validation.data;

    const candidate = await db.$transaction(async (tx) => {
      const newCandidate = await tx.candidate.create({
        data: {
          ...validatedData,
          consentDate: validatedData.consentPersonalData ? new Date() : null,
        },
      });

      const deletionDate = new Date();
      deletionDate.setFullYear(deletionDate.getFullYear() + 2);

      await tx.gDPRDeletionQueue.create({
        data: {
          candidateId: newCandidate.id,
          deletionDate,
          status: "pending",
        },
      });

      return newCandidate;
    });

    logger.info("Candidate created", { candidateId: candidate.id, userId: session.user.id });

    return apiResponse(candidate);
  } catch (error) {
    return handleApiError(error);
  }
}

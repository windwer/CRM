import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { parsePagination, buildMeta } from "@/lib/pagination";
import { candidateSchema } from "@/lib/validations/candidate";
import logger from "@/lib/logger";
import { NextRequest } from "next/server";
import { Prisma, TalentPoolStatus } from "@smartcrm/database";

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

    const talentPoolStatus = searchParams.get("talent_pool_status");
    const salaryMin = searchParams.get("salary_min") ? Number(searchParams.get("salary_min")) : undefined;
    const salaryMax = searchParams.get("salary_max") ? Number(searchParams.get("salary_max")) : undefined;
    const includeUndefined = searchParams.get("include_undefined") !== "false";

    const where: Prisma.CandidateWhereInput = includeArchived ? {} : { archivedAt: null };

    // Talent pool filter
    if (talentPoolStatus === "exclude_discarded" || !talentPoolStatus) {
      where.NOT = { talentPoolStatus: "discarded" as TalentPoolStatus };
    } else if (talentPoolStatus && talentPoolStatus !== "all") {
      where.talentPoolStatus = talentPoolStatus as TalentPoolStatus;
    }

    // Salary range filter
    if (salaryMin !== undefined || salaryMax !== undefined) {
      const salaryConditions: Prisma.CandidateWhereInput[] = [];

      if (salaryMin !== undefined && salaryMax !== undefined) {
        salaryConditions.push({
          salaryExpectationMax: { gte: salaryMin, lte: salaryMax },
        });
      } else if (salaryMin !== undefined) {
        salaryConditions.push({ salaryExpectationMax: { gte: salaryMin } });
      } else if (salaryMax !== undefined) {
        salaryConditions.push({ salaryExpectationMax: { lte: salaryMax } });
      }

      if (includeUndefined) {
        salaryConditions.push({ salaryExpectationMax: 0 });
      }

      if (salaryConditions.length > 0) {
        where.OR = salaryConditions;
      }
    }

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

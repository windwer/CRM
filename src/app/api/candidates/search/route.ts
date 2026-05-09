import { db } from "@/lib/db";
import { Prisma, SeniorityLevel } from "@smartcrm/database";
import { apiResponse, handleApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { PAGINATION_DEFAULTS, buildMeta } from "@/lib/pagination";
import { NextRequest } from "next/server";
import { z } from "zod";

const searchSchema = z
  .object({
    skills: z.array(z.string().max(50)).max(20).optional(),
    skills_mode: z.enum(["AND", "OR"]).default("AND"),
    exp_min: z.coerce.number().min(0).max(50).optional(),
    exp_max: z.coerce.number().min(0).max(50).optional(),
    seniority: z.enum(["junior", "mid", "senior", "lead"]).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).default(PAGINATION_DEFAULTS.DEFAULT_LIMIT),
  })
  .refine(
    (data) =>
      data.exp_min === undefined ||
      data.exp_max === undefined ||
      data.exp_min <= data.exp_max,
    { message: "exp_min debe ser menor o igual que exp_max" }
  );

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = await requireRole("viewer");
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const rawLimit = searchParams.get("limit")
      ? Number.parseInt(searchParams.get("limit")!, 10)
      : PAGINATION_DEFAULTS.DEFAULT_LIMIT;
    const parsed = searchSchema.parse({
      skills: [
        ...searchParams.getAll("skills[]"),
        ...searchParams.getAll("skills"),
      ].filter(Boolean),
      skills_mode: searchParams.get("skills_mode") ?? "AND",
      exp_min: searchParams.get("exp_min") ?? undefined,
      exp_max: searchParams.get("exp_max") ?? undefined,
      seniority: searchParams.get("seniority") || undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    const clamped = Number.isFinite(rawLimit) && rawLimit > PAGINATION_DEFAULTS.MAX_LIMIT;
    const page = parsed.page;
    const limit = Math.min(parsed.limit, PAGINATION_DEFAULTS.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const where: Prisma.CandidateWhereInput = {
      archivedAt: null,
    };

    if (parsed.skills && parsed.skills.length > 0) {
      if (parsed.skills_mode === "AND") {
        where.skillsArray = { hasEvery: parsed.skills };
      } else {
        where.skillsArray = { hasSome: parsed.skills };
      }
    }

    if (parsed.exp_min !== undefined || parsed.exp_max !== undefined) {
      where.experienceYears = {};
      if (parsed.exp_min !== undefined) where.experienceYears.gte = parsed.exp_min;
      if (parsed.exp_max !== undefined) where.experienceYears.lte = parsed.exp_max;
    }

    if (parsed.seniority) {
      where.seniorityLevel = parsed.seniority as SeniorityLevel;
    }

    const [candidates, total] = await db.$transaction([
      db.candidate.findMany({
        where,
        orderBy: { experienceYears: "desc" },
        skip,
        take: limit,
      }),
      db.candidate.count({ where }),
    ]);

    return apiResponse(candidates, {
      ...buildMeta(total, page, limit),
      clamped,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { Prisma, SeniorityLevel } from "@antigravity/database";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const skills = searchParams.getAll("skills[]");
    const skillsMode = searchParams.get("skills_mode") || "AND";
    const expMin = searchParams.get("exp_min") ? parseInt(searchParams.get("exp_min")!) : undefined;
    const expMax = searchParams.get("exp_max") ? parseInt(searchParams.get("exp_max")!) : undefined;
    const seniority = searchParams.get("seniority");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Prisma.CandidateWhereInput = {
      archivedAt: null,
    };

    if (skills.length > 0) {
      if (skillsMode === "AND") {
        where.skillsArray = { hasEvery: skills };
      } else {
        where.skillsArray = { hasSome: skills };
      }
    }

    if (expMin !== undefined || expMax !== undefined) {
      where.experienceYears = {};
      if (expMin !== undefined) where.experienceYears.gte = expMin;
      if (expMax !== undefined) where.experienceYears.lte = expMax;
    }

    if (seniority) {
      where.seniorityLevel = seniority as SeniorityLevel;
    }

    const [candidates, total] = await Promise.all([
      db.candidate.findMany({
        where,
        orderBy: { experienceYears: "desc" },
        skip,
        take: limit,
      }),
      db.candidate.count({ where }),
    ]);

    return apiResponse(candidates, { total, page, limit });
  } catch (error) {
    return handleApiError(error);
  }
}

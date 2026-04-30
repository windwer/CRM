import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { ApiError, handleApiError } from "@/lib/errors";
import { Prisma, SeniorityLevel } from "@antigravity/database";
import { NextRequest } from "next/server";

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const skills = [
      ...searchParams.getAll("skills[]"),
      ...searchParams.getAll("skills"),
    ].filter(Boolean);
    const skillsMode = searchParams.get("skills_mode") || "AND";
    const expMin = searchParams.get("exp_min")
      ? parseInt(searchParams.get("exp_min")!, 10)
      : undefined;
    const expMax = searchParams.get("exp_max")
      ? parseInt(searchParams.get("exp_max")!, 10)
      : undefined;
    const seniority = searchParams.get("seniority");

    const where: Prisma.CandidateWhereInput = {
      archivedAt: null,
    };

    if (skills.length > 0) {
      where.skillsArray =
        skillsMode === "AND" ? { hasEvery: skills } : { hasSome: skills };
    }

    if (expMin !== undefined || expMax !== undefined) {
      where.experienceYears = {};
      if (expMin !== undefined) where.experienceYears.gte = expMin;
      if (expMax !== undefined) where.experienceYears.lte = expMax;
    }

    if (seniority) {
      where.seniorityLevel = seniority as SeniorityLevel;
    }

    const candidates = await db.candidate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        applications: {
          select: { lastContactAt: true },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    const header = [
      "Name",
      "Email",
      "Phone",
      "Skills",
      "Experience Years",
      "Seniority",
      "Last Contact",
      "Applications Count",
    ];

    const rows = candidates.map((candidate) => {
      const lastContact = candidate.applications
        .map((application) => application.lastContactAt)
        .filter((date): date is Date => Boolean(date))
        .sort((a, b) => b.getTime() - a.getTime())[0];

      return [
        candidate.fullName,
        candidate.email,
        candidate.phone,
        candidate.skillsArray.join(", "),
        candidate.experienceYears ?? "",
        candidate.seniorityLevel ?? "",
        lastContact ? lastContact.toISOString() : "",
        candidate._count.applications,
      ];
    });

    const csv = [header, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=candidates-export.csv",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

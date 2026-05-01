import { db } from "@/lib/db";
import { ApiError, handleApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { PAGINATION_DEFAULTS } from "@/lib/pagination";
import { Prisma, SeniorityLevel } from "@antigravity/database";
import { NextRequest } from "next/server";
import { z } from "zod";

const exportFilterSchema = z
  .object({
    skills: z.array(z.string().max(50)).max(20).optional(),
    skills_mode: z.enum(["AND", "OR"]).default("AND"),
    exp_min: z.coerce.number().min(0).max(50).optional(),
    exp_max: z.coerce.number().min(0).max(50).optional(),
    seniority: z.enum(["junior", "mid", "senior", "lead"]).optional(),
  })
  .refine(
    (data) =>
      data.exp_min === undefined ||
      data.exp_max === undefined ||
      data.exp_min <= data.exp_max,
    { message: "exp_min debe ser menor o igual que exp_max" }
  );

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = await requireRole("viewer");
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const filters = exportFilterSchema.parse({
      skills: [
        ...searchParams.getAll("skills[]"),
        ...searchParams.getAll("skills"),
      ].filter(Boolean),
      skills_mode: searchParams.get("skills_mode") ?? "AND",
      exp_min: searchParams.get("exp_min") ?? undefined,
      exp_max: searchParams.get("exp_max") ?? undefined,
      seniority: searchParams.get("seniority") || undefined,
    });

    const where: Prisma.CandidateWhereInput = {
      archivedAt: null,
    };

    if (filters.skills && filters.skills.length > 0) {
      where.skillsArray =
        filters.skills_mode === "AND"
          ? { hasEvery: filters.skills }
          : { hasSome: filters.skills };
    }

    if (filters.exp_min !== undefined || filters.exp_max !== undefined) {
      where.experienceYears = {};
      if (filters.exp_min !== undefined) where.experienceYears.gte = filters.exp_min;
      if (filters.exp_max !== undefined) where.experienceYears.lte = filters.exp_max;
    }

    if (filters.seniority) {
      where.seniorityLevel = filters.seniority as SeniorityLevel;
    }

    const candidates = await db.candidate.findMany({
      where,
      take: PAGINATION_DEFAULTS.MAX_EXPORT,
      orderBy: { fullName: "asc" },
      select: {
        fullName: true,
        email: true,
        phone: true,
        skillsArray: true,
        experienceYears: true,
        seniorityLevel: true,
        applications: {
          orderBy: { lastContactAt: "desc" },
          take: 1,
          select: { lastContactAt: true },
        },
        _count: { select: { applications: true } },
      },
    });
    const truncated = candidates.length === PAGINATION_DEFAULTS.MAX_EXPORT;

    const headers = [
      "Nombre",
      "Correo",
      "Telefono",
      "Habilidades",
      "Anos experiencia",
      "Nivel",
      "Ultimo contacto",
      "Solicitudes",
    ];

    const rows = candidates.map((candidate) => [
      candidate.fullName,
      candidate.email,
      candidate.phone ?? "",
      candidate.skillsArray.join("; "),
      candidate.experienceYears ?? "",
      candidate.seniorityLevel ?? "",
      candidate.applications[0]?.lastContactAt?.toISOString() ?? "",
      candidate._count.applications,
    ]);

    const csv = [
      headers.join(","),
      ...(truncated
        ? [
            `# AVISO: Exportacion limitada a ${PAGINATION_DEFAULTS.MAX_EXPORT} candidatos.`,
            "# Aplica filtros para reducir los resultados.",
          ]
        : []),
      ...rows.map((row) => row.map(csvCell).join(",")),
    ].join("\n");

    const date = new Date().toISOString().split("T")[0];

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="candidatos-${date}.csv"`,
        "X-Total-Count": String(candidates.length),
        "X-Truncated": String(truncated),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextRequest } from "next/server";
import { Prisma } from "@smartcrm/database";
import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const TEMPLATE_HEADERS = [
  "fullName",
  "email",
  "phone",
  "linkedinUrl",
  "experienceYears",
  "seniorityLevel",
  "skills",
  "source",
  "offerId",
  "offerTitle",
  "company",
  "pipelineStageSlug",
  "candidateNotes",
  "consentPersonalData",
  "salaryExpectationMax",
];

const TEMPLATE_ROWS = [
  [
    "Ana Ejemplo",
    "ana.ejemplo@example.com",
    "+34600111222",
    "https://www.linkedin.com/in/ana-ejemplo",
    "5",
    "senior",
    "PM|Agile|Telecomunicaciones",
    "manual",
    "",
    "Project Manager",
    "Cellnex",
    "pending",
    "Importado desde CSV",
    "true",
    "60000",
  ],
  [
    "Luis Ejemplo",
    "luis.ejemplo@example.com",
    "",
    "",
    "2",
    "mid",
    "Soporte IT|Active Directory",
    "linkedin",
    "",
    "Tecnico IT",
    "Veolia",
    "awaiting_response",
    "",
    "true",
    "35000",
  ],
];

const HEADER_ALIASES: Record<string, string> = {
  nombre: "fullName",
  fullname: "fullName",
  full_name: "fullName",
  "nombre completo": "fullName",
  correo: "email",
  mail: "email",
  telefono: "phone",
  teléfono: "phone",
  linkedin: "linkedinUrl",
  linkedinurl: "linkedinUrl",
  experiencia: "experienceYears",
  experienceyears: "experienceYears",
  seniority: "seniorityLevel",
  senioritylevel: "seniorityLevel",
  nivel: "seniorityLevel",
  habilidades: "skills",
  skillsarray: "skills",
  fuente: "source",
  ofertaid: "offerId",
  offerid: "offerId",
  ofertatitulo: "offerTitle",
  offertitle: "offerTitle",
  oferta: "offerTitle",
  empresa: "company",
  stage: "pipelineStageSlug",
  stageslug: "pipelineStageSlug",
  pipelinestageslug: "pipelineStageSlug",
  etapa: "pipelineStageSlug",
  notas: "candidateNotes",
  candidatenotes: "candidateNotes",
  consentimiento: "consentPersonalData",
  consentpersonadata: "consentPersonalData",
  consentpersonaldata: "consentPersonalData",
  salario: "salaryExpectationMax",
  salary: "salaryExpectationMax",
  salaryexpectationmax: "salaryExpectationMax",
  pretensionsalarial: "salaryExpectationMax",
};

const VALID_SENIORITIES = new Set(["junior", "mid", "senior", "lead"]);
const VALID_SOURCES = new Set(["manual", "linkedin", "email", "referral"]);

type CsvRow = Record<string, string>;

// Confirmation decision per-row
const confirmationRowSchema = z.object({
  email: z.string().email(),
  action: z.enum(["import_anyway", "skip", "reactivate_and_import"]),
});

const confirmationSchema = z.array(confirmationRowSchema);

function csvEscape(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function buildTemplateCsv() {
  const rows = [TEMPLATE_HEADERS, ...TEMPLATE_ROWS];
  return rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
}

function normalizeHeader(value: string) {
  const cleaned = value
    .trim()
    .replace(/^﻿/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\s_-]+/g, "");

  return HEADER_ALIASES[cleaned] ?? value.trim();
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        index++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index++;
      row.push(field);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  return rows;
}

function rowsToObjects(rows: string[][]): CsvRow[] {
  const [headerRow, ...dataRows] = rows;
  if (!headerRow?.length) {
    throw new ApiError("VALIDATION_ERROR", "El CSV no tiene cabecera.", 400);
  }

  const headers = headerRow.map(normalizeHeader);
  return dataRows.map((row) => {
    return headers.reduce<CsvRow>((acc, header, index) => {
      acc[header] = row[index]?.trim() ?? "";
      return acc;
    }, {});
  });
}

function parseBoolean(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;
  return ["true", "1", "si", "sí", "yes", "y"].includes(normalized);
}

function parseSkills(value: string) {
  if (!value.trim()) return [];
  return value
    .split(/[|;]/)
    .map((skill) => skill.trim())
    .filter(Boolean)
    .slice(0, 50);
}

function parseInteger(value: string, fallback = 0) {
  if (!value.trim()) return fallback;
  const numberValue = Number.parseInt(value, 10);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

async function resolveOffer(row: CsvRow) {
  const offerId = row.offerId?.trim();
  const offerTitle = row.offerTitle?.trim();
  const company = row.company?.trim();

  if (offerId) {
    return db.offer.findUnique({
      where: { id: offerId },
      select: { id: true, title: true, company: true, status: true },
    });
  }

  if (!offerTitle) return null;

  return db.offer.findFirst({
    where: {
      title: { equals: offerTitle, mode: "insensitive" },
      ...(company ? { company: { equals: company, mode: "insensitive" } } : {}),
    },
    select: { id: true, title: true, company: true, status: true },
  });
}

/** Validate a row and return basic parsed data or throw */
function validateRow(row: CsvRow) {
  const email = row.email?.trim().toLowerCase();
  const fullName = row.fullName?.trim();

  if (!fullName || fullName.length < 2)
    throw new Error("Nombre obligatorio, minimo 2 caracteres.");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Email obligatorio o invalido.");
  if (!parseBoolean(row.consentPersonalData ?? ""))
    throw new Error("Consentimiento GDPR requerido.");

  const seniorityLevel = (row.seniorityLevel || "mid").trim().toLowerCase();
  if (!VALID_SENIORITIES.has(seniorityLevel))
    throw new Error("seniorityLevel debe ser junior, mid, senior o lead.");

  const source = (row.source || "manual").trim().toLowerCase();
  if (!VALID_SOURCES.has(source))
    throw new Error("source debe ser manual, linkedin, email o referral.");

  return { email, fullName, seniorityLevel, source };
}

export async function GET() {
  const csv = buildTemplateCsv();
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="plantilla-candidatos.csv"',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

    const formData = await req.formData();
    const file = formData.get("file");
    const confirmationRaw = formData.get("confirmation");

    if (!(file instanceof File)) {
      throw new ApiError("VALIDATION_ERROR", "Sube un archivo CSV.", 400);
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      throw new ApiError("VALIDATION_ERROR", "El archivo debe ser .csv.", 400);
    }

    const rows = rowsToObjects(parseCsv(await file.text()));
    if (rows.length === 0) {
      throw new ApiError("VALIDATION_ERROR", "El CSV no contiene candidatos.", 400);
    }
    if (rows.length > 500) {
      throw new ApiError("VALIDATION_ERROR", "Maximo 500 candidatos por importacion.", 400);
    }

    // Parse confirmation decisions if provided
    let confirmationMap: Map<string, "import_anyway" | "skip" | "reactivate_and_import"> | null = null;
    if (confirmationRaw) {
      const parsed = confirmationSchema.safeParse(JSON.parse(String(confirmationRaw)));
      if (!parsed.success) {
        throw new ApiError("VALIDATION_ERROR", "Formato de confirmacion invalido.", 400);
      }
      confirmationMap = new Map(parsed.data.map((d) => [d.email, d.action]));
    }

    const pendingStage = await db.pipelineStage.findFirst({
      where: { slug: "pending", isActive: true, offerId: null },
      orderBy: { order: "asc" },
    });

    if (!pendingStage) {
      throw new ApiError("VALIDATION_ERROR", "No existe la etapa pending.", 400);
    }

    // --- CATEGORIZE ROWS ---
    type CategoryA = { type: "new"; row: CsvRow; email: string; fullName: string; seniorityLevel: string; source: string };
    type CategoryB = { type: "in_active_offer"; row: CsvRow; email: string; candidateId: string; offerTitle: string };
    type CategoryC = { type: "discarded"; row: CsvRow; email: string; candidateId: string };
    type CategoryD = { row: number; email?: string; message: string };

    const categoryA: CategoryA[] = [];
    const categoryB: CategoryB[] = [];
    const categoryC: CategoryC[] = [];
    const categoryD: CategoryD[] = [];

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNumber = index + 2;

      try {
        const { email, fullName, seniorityLevel, source } = validateRow(row);

        const existing = await db.candidate.findUnique({
          where: { email },
          select: {
            id: true,
            talentPoolStatus: true,
            applications: {
              where: { offer: { status: "published" } },
              select: { offer: { select: { title: true } } },
              take: 1,
            },
          },
        });

        if (!existing) {
          categoryA.push({ type: "new", row, email, fullName, seniorityLevel, source });
        } else if (existing.talentPoolStatus === "discarded") {
          categoryC.push({ type: "discarded", row, email, candidateId: existing.id });
        } else if (existing.applications.length > 0) {
          categoryB.push({
            type: "in_active_offer",
            row,
            email,
            candidateId: existing.id,
            offerTitle: existing.applications[0]?.offer?.title ?? "Oferta activa",
          });
        }
        // else: existing candidate not discarded, not in active offer → already processed, skip quietly
      } catch (error: any) {
        categoryD.push({
          row: rowNumber,
          email: row.email?.trim().toLowerCase(),
          message: error?.message ?? "Error desconocido.",
        });
      }
    }

    // --- PROCESS CATEGORY A (always import new candidates) ---
    let createdCandidates = 0;
    let applicationsCreated = 0;

    for (const item of categoryA) {
      try {
        const offer = await resolveOffer(item.row);
        const stageSlug = item.row.pipelineStageSlug?.trim() || "pending";
        const stage = await db.pipelineStage.findFirst({
          where: { slug: stageSlug, isActive: true, offerId: null },
        });
        const effectiveStage = stage ?? pendingStage;

        await db.$transaction(async (tx) => {
          const created = await tx.candidate.create({
            data: {
              fullName: item.fullName,
              email: item.email,
              phone: item.row.phone?.trim() || null,
              linkedinUrl: item.row.linkedinUrl?.trim() || null,
              experienceYears: Math.min(Math.max(parseInteger(item.row.experienceYears ?? "0"), 0), 50),
              seniorityLevel: item.seniorityLevel as any,
              skillsArray: parseSkills(item.row.skills ?? ""),
              source: item.source as any,
              salaryExpectationMax: parseInteger(item.row.salaryExpectationMax ?? "0", 0),
              consentPersonalData: true,
              consentDate: new Date(),
              consentSource: "Importacion CSV",
              importedAt: new Date(),
              talentPoolStatus: "active" as any,
            },
          });

          const deletionDate = new Date();
          deletionDate.setFullYear(deletionDate.getFullYear() + 2);
          await tx.gDPRDeletionQueue.create({
            data: { candidateId: created.id, deletionDate, status: "pending", reason: "Importacion CSV" },
          });

          createdCandidates++;

          if (offer && offer.status !== "closed_hired") {
            const exists = await tx.application.findUnique({
              where: { candidateId_offerId: { candidateId: created.id, offerId: offer.id } },
            });
            if (!exists) {
              await tx.application.create({
                data: {
                  candidateId: created.id,
                  offerId: offer.id,
                  pipelineStageId: effectiveStage.id,
                  candidateNotes: item.row.candidateNotes?.trim() || null,
                  appliedAt: new Date(),
                },
              });
              applicationsCreated++;
            }
          }
        });
      } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          // duplicate email race — skip
        }
      }
    }

    // --- NO CONFIRMATION: return warnings and require confirmation ---
    if (!confirmationMap && (categoryB.length > 0 || categoryC.length > 0)) {
      return apiResponse({
        imported: createdCandidates,
        applicationsCreated,
        warnings: {
          in_active_offer: categoryB.map((b) => ({
            email: b.email,
            offerTitle: b.offerTitle,
          })),
          discarded: categoryC.map((c) => ({ email: c.email })),
        },
        invalid: categoryD,
        requires_confirmation: true,
      });
    }

    // --- WITH CONFIRMATION: process B and C decisions ---
    let skipped = 0;
    let reactivated = 0;
    let extraApplications = 0;

    if (confirmationMap) {
      // Process category B (in active offer)
      for (const item of categoryB) {
        const action = confirmationMap.get(item.email) ?? "skip";
        if (action === "skip") {
          skipped++;
          continue;
        }
        if (action === "import_anyway") {
          const offer = await resolveOffer(item.row);
          if (offer && offer.status !== "closed_hired") {
            const stageSlug = item.row.pipelineStageSlug?.trim() || "pending";
            const stage = (await db.pipelineStage.findFirst({
              where: { slug: stageSlug, isActive: true, offerId: null },
            })) ?? pendingStage;
            const exists = await db.application.findUnique({
              where: { candidateId_offerId: { candidateId: item.candidateId, offerId: offer.id } },
            });
            if (!exists) {
              await db.application.create({
                data: {
                  candidateId: item.candidateId,
                  offerId: offer.id,
                  pipelineStageId: stage.id,
                  candidateNotes: item.row.candidateNotes?.trim() || null,
                  appliedAt: new Date(),
                },
              });
              extraApplications++;
            }
          }
        }
      }

      // Process category C (discarded)
      for (const item of categoryC) {
        const action = confirmationMap.get(item.email) ?? "skip";
        if (action === "skip") {
          skipped++;
          continue;
        }
        if (action === "reactivate_and_import") {
          await db.candidate.update({
            where: { id: item.candidateId },
            data: { talentPoolStatus: "active" as any },
          });
          reactivated++;

          const offer = await resolveOffer(item.row);
          if (offer && offer.status !== "closed_hired") {
            const stageSlug = item.row.pipelineStageSlug?.trim() || "pending";
            const stage = (await db.pipelineStage.findFirst({
              where: { slug: stageSlug, isActive: true, offerId: null },
            })) ?? pendingStage;
            const exists = await db.application.findUnique({
              where: { candidateId_offerId: { candidateId: item.candidateId, offerId: offer.id } },
            });
            if (!exists) {
              await db.application.create({
                data: {
                  candidateId: item.candidateId,
                  offerId: offer.id,
                  pipelineStageId: stage.id,
                  candidateNotes: item.row.candidateNotes?.trim() || null,
                  appliedAt: new Date(),
                },
              });
              extraApplications++;
            }
          }
        }
      }
    }

    return apiResponse({
      imported: createdCandidates,
      applicationsCreated: applicationsCreated + extraApplications,
      skipped,
      reactivated,
      invalid: categoryD,
      requires_confirmation: false,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

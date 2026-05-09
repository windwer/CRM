import { NextRequest } from "next/server";
import { Prisma } from "@smartcrm/database";
import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";

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
};

const VALID_SENIORITIES = new Set(["junior", "mid", "senior", "lead"]);
const VALID_SOURCES = new Set(["manual", "linkedin", "email", "referral"]);

type CsvRow = Record<string, string>;

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
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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
    const { session, errorResponse } = await requireRole("recruiter");
    if (errorResponse) return errorResponse;

    const formData = await req.formData();
    const file = formData.get("file");
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

    const pendingStage = await db.pipelineStage.findFirst({
      where: { slug: "pending", isActive: true },
      orderBy: { order: "asc" },
    });

    if (!pendingStage) {
      throw new ApiError("VALIDATION_ERROR", "No existe la etapa pending.", 400);
    }

    const result = {
      totalRows: rows.length,
      createdCandidates: 0,
      existingCandidates: 0,
      applicationsCreated: 0,
      applicationsSkipped: 0,
      errors: [] as Array<{ row: number; email?: string; message: string }>,
    };

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNumber = index + 2;
      const email = row.email?.trim().toLowerCase();
      const fullName = row.fullName?.trim();

      try {
        if (!fullName || fullName.length < 2) {
          throw new Error("Nombre obligatorio, minimo 2 caracteres.");
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new Error("Email obligatorio o invalido.");
        }
        if (!parseBoolean(row.consentPersonalData ?? "")) {
          throw new Error("Consentimiento GDPR requerido.");
        }

        const seniorityLevel = (row.seniorityLevel || "mid").trim().toLowerCase();
        if (!VALID_SENIORITIES.has(seniorityLevel)) {
          throw new Error("seniorityLevel debe ser junior, mid, senior o lead.");
        }

        const source = (row.source || "manual").trim().toLowerCase();
        if (!VALID_SOURCES.has(source)) {
          throw new Error("source debe ser manual, linkedin, email o referral.");
        }

        const offer = await resolveOffer(row);
        if ((row.offerId || row.offerTitle) && !offer) {
          throw new Error("Oferta no encontrada para esta fila.");
        }
        if (offer?.status === "closed_hired") {
          throw new Error("No se pueden anadir candidatos a una oferta cerrada con contratacion.");
        }

        const stageSlug = row.pipelineStageSlug?.trim() || "pending";
        const stage = await db.pipelineStage.findFirst({
          where: { slug: stageSlug, isActive: true },
        });
        if (!stage) {
          throw new Error(`Etapa no encontrada o inactiva: ${stageSlug}.`);
        }

        const candidate = await db.$transaction(async (tx) => {
          const existing = await tx.candidate.findUnique({ where: { email } });
          if (existing) {
            result.existingCandidates++;
            return existing;
          }

          const created = await tx.candidate.create({
            data: {
              fullName,
              email,
              phone: row.phone?.trim() || null,
              linkedinUrl: row.linkedinUrl?.trim() || null,
              experienceYears: Math.min(Math.max(parseInteger(row.experienceYears ?? "0"), 0), 50),
              seniorityLevel: seniorityLevel as any,
              skillsArray: parseSkills(row.skills ?? ""),
              source: source as any,
              consentPersonalData: true,
              consentDate: new Date(),
              consentSource: "Importacion CSV",
              importedAt: new Date(),
            },
          });

          const deletionDate = new Date();
          deletionDate.setFullYear(deletionDate.getFullYear() + 2);

          await tx.gDPRDeletionQueue.create({
            data: {
              candidateId: created.id,
              deletionDate,
              status: "pending",
              reason: "Importacion CSV",
            },
          });

          result.createdCandidates++;
          return created;
        });

        if (offer) {
          const existingApplication = await db.application.findUnique({
            where: {
              candidateId_offerId: {
                candidateId: candidate.id,
                offerId: offer.id,
              },
            },
          });

          if (existingApplication) {
            result.applicationsSkipped++;
          } else {
            await db.application.create({
              data: {
                candidateId: candidate.id,
                offerId: offer.id,
                pipelineStageId: stage.id,
                candidateNotes: row.candidateNotes?.trim() || null,
                appliedAt: new Date(),
              },
            });
            result.applicationsCreated++;
          }
        }
      } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          result.errors.push({
            row: rowNumber,
            email,
            message: "Email ya existe en el sistema.",
          });
        } else {
          result.errors.push({
            row: rowNumber,
            email,
            message: error?.message ?? "Error desconocido.",
          });
        }
      }
    }

    return apiResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

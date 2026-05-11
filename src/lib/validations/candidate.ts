import { z } from "zod";

export const TALENT_POOL_STATUSES = ["active", "may_fit_future", "discarded"] as const;
export type TalentPoolStatus = (typeof TALENT_POOL_STATUSES)[number];

export const candidateSchema = z.object({
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().max(20).nullable().optional()
  ),
  linkedinUrl: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().url("Invalid LinkedIn URL").nullable().optional()
  ),
  experienceYears: z.number().int().min(0).max(50).default(0),
  seniorityLevel: z.enum(["junior", "mid", "senior", "lead"]).default("mid"),
  skillsArray: z.array(z.string().max(50)).max(50).default([]),
  salaryExpectationMax: z.number().int().min(0).default(0),
  currency: z.string().max(10).default("EUR"),
  consentPersonalData: z.boolean().refine((val) => val === true, {
    message: "Candidate consent is required",
  }),
});

export const candidateUpdateSchema = candidateSchema
  .omit({ consentPersonalData: true })
  .partial();

export const talentPoolStatusSchema = z.object({
  talent_pool_status: z.enum(TALENT_POOL_STATUSES, {
    message: "Estado debe ser active, may_fit_future o discarded",
  }),
});

export const bulkTalentPoolSchema = z.object({
  candidate_ids: z
    .array(z.string().uuid("ID de candidato inválido"))
    .min(1, "Debes seleccionar al menos un candidato")
    .max(100, "Máximo 100 candidatos por acción bulk"),
  talent_pool_status: z.enum(TALENT_POOL_STATUSES, {
    message: "Estado debe ser active, may_fit_future o discarded",
  }),
});

export const candidateFiltersSchema = z
  .object({
    talent_pool_status: z
      .enum([...TALENT_POOL_STATUSES, "exclude_discarded"] as [string, ...string[]])
      .optional(),
    salary_min: z.coerce.number().int().min(0).optional(),
    salary_max: z.coerce.number().int().min(0).optional(),
    include_undefined: z.coerce.boolean().default(true),
    archived: z.coerce.boolean().optional(),
  })
  .refine(
    (data) =>
      data.salary_min === undefined ||
      data.salary_max === undefined ||
      data.salary_min <= data.salary_max,
    { message: "salary_min debe ser menor o igual que salary_max" }
  );

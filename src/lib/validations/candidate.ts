import { z } from "zod";

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

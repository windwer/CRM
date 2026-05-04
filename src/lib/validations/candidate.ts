import { z } from "zod";

export const candidateSchema = z.object({
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().optional(),
  linkedinUrl: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().url("Invalid LinkedIn URL").optional()
  ),
  experienceYears: z.number().min(0).default(0),
  seniorityLevel: z.enum(["junior", "mid", "senior", "lead"]).default("mid"),
  skillsArray: z.array(z.string()).default([]),
  consentPersonalData: z.boolean().refine((val) => val === true, {
    message: "Candidate consent is required",
  }),
});

export const candidateUpdateSchema = candidateSchema.partial();

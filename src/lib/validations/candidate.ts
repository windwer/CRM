import { z } from "zod";

export const candidateSchema = z.object({
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().optional(),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  experienceYears: z.number().min(0).default(0),
  seniorityLevel: z.enum(["junior", "mid", "senior", "lead"]).default("mid"),
  skillsArray: z.array(z.string()).default([]),
  consentPersonalData: z.boolean().refine((val) => val === true, {
    message: "Candidate consent is required",
  }),
});

export const candidateUpdateSchema = candidateSchema.partial();

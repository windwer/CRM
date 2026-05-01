import { z } from "zod";

export const parseCVSchema = z.union([
  z.object({
    candidateId: z.string().uuid(),
    blobId: z.string().min(1),
  }).transform((data) => data),
  z.object({
    candidate_id: z.string().uuid(),
    blob_id: z.string().min(1),
  }).transform((data) => ({
    candidateId: data.candidate_id,
    blobId: data.blob_id,
  })),
]);

export const scoreMatchSchema = z.union([
  z.object({
    candidateId: z.string().uuid(),
    offerId: z.string().uuid(),
    applicationId: z.string().uuid().optional(),
  }).transform((data) => data),
  z.object({
    candidate_id: z.string().uuid(),
    offer_id: z.string().uuid(),
    application_id: z.string().uuid().optional(),
  }).transform((data) => ({
    candidateId: data.candidate_id,
    offerId: data.offer_id,
    applicationId: data.application_id,
  })),
]);

export const parsedCVSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin: z.string().optional(),
  summary: z.string().optional(),
  skills: z.array(z.string()).default([]),
  experience: z.array(z.object({
    company: z.string().optional(),
    position: z.string().optional(),
    duration: z.object({
      start: z.string().optional(),
      end: z.string().optional(),
      years: z.number().optional(),
    }).optional(),
    description: z.string().optional(),
    key_achievements: z.array(z.string()).default([]),
    technologies_used: z.array(z.string()).default([]),
  })).default([]),
  education: z.array(z.object({
    institution: z.string().optional(),
    degree: z.string().optional(),
    field: z.string().optional(),
    graduation_year: z.string().optional(),
    honors: z.string().optional(),
  })).default([]),
  certifications: z.array(z.object({
    name: z.string().optional(),
    issuer: z.string().optional(),
    date: z.string().optional(),
    credential_id: z.string().optional(),
  })).default([]),
  languages: z.array(z.object({
    language: z.string().optional(),
    proficiency: z.enum(["native", "fluent", "intermediate", "basic"]).optional(),
  })).default([]),
  seniority_level: z.enum(["junior", "mid", "senior", "lead"]).optional(),
  total_years_experience: z.number().optional(),
  key_skills_technical: z.array(z.string()).default([]),
  key_skills_soft: z.array(z.string()).default([]),
});

export const scoreResultSchema = z.object({
  overall_score: z.number().min(0).max(1),
  score_breakdown: z.object({
    skills_match: z.number().optional(),
    experience_match: z.number().optional(),
    education_match: z.number().optional(),
    cultural_fit_estimated: z.number().optional(),
  }),
  matched_required_skills: z.array(z.string()).default([]),
  missing_required_skills: z.array(z.string()).default([]),
  matched_nice_to_have: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  recommendation: z.enum(["strong_candidate", "good_candidate", "potential", "not_suitable"]),
  summary: z.string(),
});

export type ParsedCV = z.infer<typeof parsedCVSchema>;
export type ScoreResult = z.infer<typeof scoreResultSchema>;

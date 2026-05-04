import { z } from "zod";

export const applicationSchema = z.object({
  offerId: z.string().uuid("Invalid offer ID"),
  candidateId: z.string().uuid("Invalid candidate ID"),
  status: z.enum([
    "prospect",
    "applied",
    "screening",
    "interview_1",
    "interview_2",
    "interview_3",
    "offer",
    "hired",
    "rejected",
  ]).default("prospect"),
});

export const applicationCreateSchema = z.object({
  candidateId: z.string().uuid(),
  offerId: z.string().uuid(),
  pipelineStageId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  candidateNotes: z.string().max(2000).optional(),
});

export const applicationUpdateSchema = z.object({
  pipelineStageId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  candidateNotes: z.string().max(2000).optional(),
  internal_notes: z.string().max(5000).optional(),
});

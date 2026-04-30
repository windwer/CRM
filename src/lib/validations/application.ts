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

export const applicationUpdateSchema = applicationSchema.partial();

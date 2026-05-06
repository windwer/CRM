import { z } from "zod";

export const POSITION_TYPES = [
  "developer",
  "designer",
  "manager",
  "product",
  "marketing",
  "sales",
  "data",
  "devops",
  "qa",
  "other",
] as const;

const offerBaseSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  department: z.string().min(1, "Department is required"),
  location: z.string().min(1, "Location is required"),
  salaryMin: z.number().nonnegative().optional(),
  salaryMax: z.number().nonnegative().optional(),
  status: z
    .enum(["draft", "published", "paused", "closed_hired", "closed_no_hire"])
    .default("draft"),
  requirements: z.string().optional(),
  jobType: z.enum(["full_time", "part_time", "contract", "internship"]).optional(),
  company: z.string().max(100).optional(),
  positionType: z.enum(POSITION_TYPES).optional(),
  isUrgent: z.boolean().default(false),
  customTags: z.array(z.string().max(30)).max(10).default([]),
  mustHaves: z.string().max(2000).optional(),
});

const salaryRefinement = (data: any) => {
  if (data.salaryMin !== undefined && data.salaryMax !== undefined) {
    return data.salaryMax >= data.salaryMin;
  }
  return true;
};

const salaryRefinementError = {
  message: "Maximum salary cannot be less than minimum salary",
  path: ["salaryMax"],
};

export const offerSchema = offerBaseSchema.refine(salaryRefinement, salaryRefinementError);

export const offerUpdateSchema = offerBaseSchema
  .omit({ status: true })
  .partial()
  .refine(salaryRefinement, salaryRefinementError);

export const applyOfferSchema = z.union([
  z.object({
    candidateId: z.string().uuid(),
    assignedToId: z.string().uuid().optional(),
    candidateNotes: z.string().max(2000).optional(),
    pipelineStageId: z.string().uuid().optional(),
  }).transform((data) => data),
  z.object({
    candidate_id: z.string().uuid(),
    assignedToId: z.string().uuid().optional(),
    candidateNotes: z.string().max(2000).optional(),
    pipelineStageId: z.string().uuid().optional(),
  }).transform((data) => ({
    candidateId: data.candidate_id,
    assignedToId: data.assignedToId,
    candidateNotes: data.candidateNotes,
    pipelineStageId: data.pipelineStageId,
  })),
]);

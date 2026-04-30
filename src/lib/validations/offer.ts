import { z } from "zod";

const offerBaseSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  department: z.string().min(1, "Department is required"),
  location: z.string().min(1, "Location is required"),
  salaryMin: z.number().nonnegative().optional(),
  salaryMax: z.number().nonnegative().optional(),
  status: z.enum(["draft", "published", "paused", "closed", "archived"]).default("draft"),
  requirements: z.string().optional(),
  jobType: z.enum(["full_time", "part_time", "contract", "internship"]).optional(),
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

export const offerUpdateSchema = offerBaseSchema.partial().refine(salaryRefinement, salaryRefinementError);

import { z } from "zod";

export const emailSchema = z.object({
  application_id: z.string().uuid("Invalid application ID"),
  to: z.string().email("Invalid recipient email"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Email body cannot be empty"),
  cc: z.array(z.string().email("Invalid CC email")).optional(),
  bcc: z.array(z.string().email("Invalid BCC email")).optional(),
  template_id: z.string().uuid("Invalid template ID").optional(),
});

export const emailTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Template subject is required"),
  body: z.string().min(1, "Template body is required"),
  variables: z.array(z.string()).default([]),
});

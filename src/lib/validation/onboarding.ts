import { z } from "zod";

export const profileStepSchema = z.object({
  display_name: z.string().trim().min(1, "Namn krävs").max(120, "Max 120 tecken"),
  avatar_url: z.string().trim().url("Måste vara en giltig URL").or(z.literal("")).optional(),
  language: z.enum(["sv", "en"]),
});
export type ProfileStepInput = z.infer<typeof profileStepSchema>;

export const createOrgSchema = z.object({
  name: z.string().trim().min(1, "Organisationsnamn krävs").max(200),
  org_number: z.string().trim().max(40).optional().or(z.literal("")),
  country: z.string().trim().max(2, "Använd tvåbokstavskod, t.ex. SE").optional().or(z.literal("")),
});
export type CreateOrgInput = z.infer<typeof createOrgSchema>;

export const joinOrgSchema = z.object({
  token: z.string().trim().min(8, "Inbjudningskod krävs"),
});
export type JoinOrgInput = z.infer<typeof joinOrgSchema>;

export const experienceRoleSchema = z.object({
  experience_role: z.enum([
    "machine_owner",
    "service_tech",
    "oem",
    "bank_finance",
    "insurance",
  ]),
});
export type ExperienceRoleInput = z.infer<typeof experienceRoleSchema>;

import { z } from "zod";

export const orgFormSchema = z.object({
  name: z.string().trim().min(1, "Namn krävs").max(200, "Max 200 tecken"),
  org_number: z.string().trim().max(40, "Max 40 tecken").optional().or(z.literal("")),
  country: z
    .string()
    .trim()
    .max(2, "Använd tvåbokstavskod, t.ex. SE")
    .optional()
    .or(z.literal("")),
  logo_url: z
    .string()
    .trim()
    .url("Måste vara en giltig URL")
    .optional()
    .or(z.literal("")),
});
export type OrgFormInput = z.infer<typeof orgFormSchema>;

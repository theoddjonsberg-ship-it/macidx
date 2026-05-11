import { z } from "zod";

export const profileFormSchema = z.object({
  display_name: z.string().trim().min(1, "Namn krävs").max(120, "Max 120 tecken"),
  avatar_url: z.string().trim().url("Måste vara en giltig URL").or(z.literal("")).optional(),
});
export type ProfileFormInput = z.infer<typeof profileFormSchema>;

export const passwordFormSchema = z
  .object({
    password: z.string().min(8, "Minst 8 tecken").max(128, "Max 128 tecken"),
    confirm: z.string().min(8, "Minst 8 tecken").max(128, "Max 128 tecken"),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Lösenorden matchar inte",
    path: ["confirm"],
  });
export type PasswordFormInput = z.infer<typeof passwordFormSchema>;

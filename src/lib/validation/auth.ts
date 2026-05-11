import { z } from "zod";

export const emailSchema = z.string().trim().email("Ange en giltig e-postadress");

export const passwordSchema = z
  .string()
  .min(8, "Minst 8 tecken")
  .max(128, "Max 128 tecken");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Lösenord krävs"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export type SignupInput = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Lösenorden matchar inte",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

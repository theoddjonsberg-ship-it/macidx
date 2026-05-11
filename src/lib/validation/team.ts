import { z } from "zod";

export const inviteRoleSchema = z.enum(["admin", "member", "viewer"]);
export type InviteRole = z.infer<typeof inviteRoleSchema>;

export const inviteSchema = z.object({
  email: z.string().trim().email("Ange en giltig e-postadress"),
  role: inviteRoleSchema,
});
export type InviteInput = z.infer<typeof inviteSchema>;

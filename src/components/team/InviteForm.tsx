import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { generateInviteToken, sha256Hex } from "@/lib/crypto";
import { inviteSchema, type InviteInput } from "@/lib/validation/team";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";

interface Props {
  orgId: string;
  onClose: () => void;
}

export function InviteForm({ orgId, onClose }: Props) {
  const { user } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "member" },
  });

  const onSubmit = async (values: InviteInput) => {
    if (!user) return;
    setSubmitError(null);

    const token = generateInviteToken();
    const token_hash = await sha256Hex(token);

    const { error } = await supabase.from("org_invitations").insert({
      org_id: orgId,
      email: values.email,
      role: values.role,
      token_hash,
      invited_by: user.id,
    });
    if (error) {
      setSubmitError(error.message);
      return;
    }
    setCreatedToken(token);
  };

  const copy = async () => {
    if (!createdToken) return;
    try {
      await navigator.clipboard.writeText(createdToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (createdToken) {
    return (
      <div className="space-y-3">
        <p className="text-sm">
          Inbjudan skapad. Skicka koden nedan till mottagaren — den visas bara nu.
        </p>
        <div className="font-mono text-xs break-all p-3 rounded-control bg-surface-track border border-border">
          {createdToken}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={copy}>
            {copied ? "Kopierat" : "Kopiera"}
          </Button>
          <Button type="button" size="sm" onClick={onClose}>
            Klar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <div className="space-y-2">
        <Label htmlFor="invite-email">E-post</Label>
        <Input
          id="invite-email"
          type="email"
          autoComplete="email"
          autoFocus
          {...register("email")}
          aria-invalid={!!errors.email}
        />
        <FormError>{errors.email?.message}</FormError>
      </div>

      <div className="space-y-2">
        <Label htmlFor="invite-role">Roll</Label>
        <select
          id="invite-role"
          {...register("role")}
          className="h-11 min-h-touch w-full rounded-control bg-surface-raised text-foreground border border-border px-3 text-sm transition-colors ease-standard duration-base focus:border-primary/40"
        >
          <option value="admin">Admin</option>
          <option value="member">Member</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>

      <FormError>{submitError}</FormError>

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={isSubmitting} size="sm">
          {isSubmitting ? "Skapar…" : "Skapa inbjudan"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Avbryt
        </Button>
      </div>
    </form>
  );
}

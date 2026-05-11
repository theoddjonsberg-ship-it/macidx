import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { useMyOrgRole } from "@/hooks/useMyOrgRole";
import {
  orgFormSchema,
  type OrgFormInput,
} from "@/lib/validation/organization";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";
import { Skeleton } from "@/components/ui/Skeleton";

export function Organization() {
  return (
    <AppShell>
      <DashboardHeader
        title="Organisation"
        subtitle="Inställningar för din organisation."
      />
      <div className="max-w-xl">
        <OrganizationForm />
      </div>
    </AppShell>
  );
}

function OrganizationForm() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: org, isLoading: orgLoading } = useActiveOrg();
  const { data: myRole, isLoading: roleLoading } = useMyOrgRole(org?.id);

  const canEdit = myRole === "owner" || myRole === "admin";

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<OrgFormInput>({
    resolver: zodResolver(orgFormSchema),
    defaultValues: { name: "", org_number: "", country: "", logo_url: "" },
    values: org
      ? {
          name: org.name ?? "",
          org_number: org.org_number ?? "",
          country: org.country ?? "",
          logo_url: org.logo_url ?? "",
        }
      : undefined,
  });

  const onSubmit = async (values: OrgFormInput) => {
    if (!org) return;
    setSubmitError(null);
    setSaved(false);
    const { error } = await supabase
      .from("organizations")
      .update({
        name: values.name,
        org_number: values.org_number || null,
        country: values.country || null,
        logo_url: values.logo_url || null,
      })
      .eq("id", org.id);
    if (error) {
      setSubmitError(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["active-org", user?.id] });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (orgLoading || roleLoading) {
    return (
      <Card>
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-10 w-full mb-3" />
        <Skeleton className="h-10 w-full mb-3" />
        <Skeleton className="h-10 w-full" />
      </Card>
    );
  }

  if (!org) {
    return (
      <Card>
        <p className="text-sm text-muted-foreground">
          Ingen aktiv organisation. Slutför onboarding eller bli inbjuden.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
        Uppgifter
      </p>

      {!canEdit && (
        <p className="text-xs text-muted-foreground mt-2">
          Du har läsbehörighet. Endast ägare och administratörer kan ändra.
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-3" noValidate>
        <div className="space-y-2">
          <Label htmlFor="name">Namn</Label>
          <Input
            id="name"
            disabled={!canEdit}
            {...register("name")}
            aria-invalid={!!errors.name}
          />
          <FormError>{errors.name?.message}</FormError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="org_number">Org-nummer</Label>
          <Input
            id="org_number"
            disabled={!canEdit}
            {...register("org_number")}
            aria-invalid={!!errors.org_number}
          />
          <FormError>{errors.org_number?.message}</FormError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Land (ISO-kod)</Label>
          <Input
            id="country"
            maxLength={2}
            placeholder="SE"
            disabled={!canEdit}
            {...register("country")}
            aria-invalid={!!errors.country}
          />
          <FormError>{errors.country?.message}</FormError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo_url">Logo URL (valfri)</Label>
          <Input
            id="logo_url"
            type="url"
            placeholder="https://..."
            disabled={!canEdit}
            {...register("logo_url")}
            aria-invalid={!!errors.logo_url}
          />
          <FormError>{errors.logo_url?.message}</FormError>
        </div>

        <FormError>{submitError}</FormError>

        {canEdit && (
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? "Sparar…" : "Spara"}
            </Button>
            {saved && (
              <span className="text-xs text-muted-foreground" role="status">
                Sparat
              </span>
            )}
          </div>
        )}
      </form>
    </Card>
  );
}

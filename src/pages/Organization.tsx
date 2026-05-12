import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, X, Eye, AlertTriangle, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { useMyOrgRole } from "@/hooks/useMyOrgRole";
import { useOrgGrantedConsents, type OrgConsent } from "@/hooks/useOrgGrantedConsents";
import { useRevokeConsent, CONSENT_LEVEL_LABELS } from "@/hooks/useMachineConsents";
import { ORG_TYPE_LABELS } from "@/hooks/useEligiblePartnerOrgs";
import { GrantConsentDialog } from "@/components/consent/GrantConsentDialog";
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
import { cn } from "@/lib/utils";

export function Organization() {
  const { data: org } = useActiveOrg();
  const { data: myRole } = useMyOrgRole(org?.id);
  const canManage = myRole === "owner" || myRole === "admin";

  return (
    <AppShell>
      <DashboardHeader
        title="Organisation"
        subtitle="Inställningar för din organisation."
      />
      <div className="space-y-6 max-w-xl">
        <OrganizationForm />
        <ConsentSection canManage={canManage} />
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

// =============================================================================
// Consent Section
// =============================================================================
function ConsentSection({ canManage }: { canManage: boolean }) {
  const { data: consents, isLoading } = useOrgGrantedConsents();
  const revokeConsent = useRevokeConsent();
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<OrgConsent | null>(null);

  const handleRevoke = async () => {
    if (!confirmRevoke) return;
    await revokeConsent.mutateAsync({ consentId: confirmRevoke.id });
    setConfirmRevoke(null);
  };

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </Card>
    );
  }

  const activeConsents = consents ?? [];

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" strokeWidth={1.75} />
            <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
              Delar med
            </p>
          </div>
          {canManage && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowGrantDialog(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.75} />
              Ge nytt samtycke
            </Button>
          )}
        </div>

        {activeConsents.length === 0 ? (
          <div className="text-center py-8">
            <ShieldCheck className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-foreground mb-1">
              Inga aktiva samtycken
            </p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Du har inte delat maskindata med några externa parter. Dela med
              försäkrings- eller finansbolag för bättre offerter.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeConsents.map((consent) => {
              const expiresLabel = consent.expires_at
                ? `Giltigt till ${new Date(consent.expires_at).toLocaleDateString("sv-SE")}`
                : "Tills vidare";
              const expiringSoon =
                consent.expires_at &&
                new Date(consent.expires_at).getTime() - Date.now() <
                  30 * 24 * 60 * 60 * 1000;

              return (
                <div
                  key={consent.id}
                  className="flex items-start gap-3 p-3 rounded-control bg-muted/10 hover:bg-muted/20 transition-colors"
                >
                  <div className="h-9 w-9 rounded-control bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-4 w-4 text-primary" strokeWidth={1.75} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-foreground font-medium truncate">
                        {consent.viewer_org_name}
                      </p>
                      {consent.viewer_org_type && (
                        <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          {ORG_TYPE_LABELS[consent.viewer_org_type] ?? consent.viewer_org_type}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                      <span className="font-medium">
                        {CONSENT_LEVEL_LABELS[consent.consent_level] ?? `Nivå ${consent.consent_level}`}
                      </span>
                      <span>·</span>
                      <span className={cn(expiringSoon && "text-warning")}>
                        {expiresLabel}
                      </span>
                    </div>

                    {consent.purpose && (
                      <p className="text-xs text-muted-foreground/70 mt-1 italic">
                        "{consent.purpose}"
                      </p>
                    )}

                    <p className="text-[10px] text-muted-foreground/50 mt-1">
                      Beviljat{" "}
                      {new Date(consent.granted_at).toLocaleDateString("sv-SE")}
                      {consent.granted_by_name && ` av ${consent.granted_by_name}`}
                    </p>
                  </div>

                  {canManage && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setConfirmRevoke(consent)}
                      className="flex-shrink-0 text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Revoke confirmation dialog */}
      {confirmRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="max-w-sm w-full">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-destructive" strokeWidth={1.75} />
              <h3 className="text-sm font-semibold text-foreground">
                Återkalla samtycke
              </h3>
            </div>

            <div className="p-3 rounded-control bg-muted/10 mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                <span className="text-sm font-medium text-foreground">
                  {confirmRevoke.viewer_org_name}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {CONSENT_LEVEL_LABELS[confirmRevoke.consent_level] ?? `Nivå ${confirmRevoke.consent_level}`}
              </p>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Är du säker på att du vill återkalla detta samtycke?{" "}
              <span className="font-medium text-foreground">
                {confirmRevoke.viewer_org_name}
              </span>{" "}
              kommer inte längre ha tillgång till dina maskindata.
            </p>

            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={() => setConfirmRevoke(null)}>
                Avbryt
              </Button>
              <Button
                onClick={handleRevoke}
                disabled={revokeConsent.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {revokeConsent.isPending ? "Återkallar..." : "Återkalla"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Grant consent dialog */}
      <GrantConsentDialog
        open={showGrantDialog}
        onClose={() => setShowGrantDialog(false)}
      />
    </>
  );
}

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, AlertCircle, Clock, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { FormError } from "@/components/ui/FormError";
import type { AppRole } from "@/types/database";

function roleLabel(role: AppRole): string {
  switch (role) {
    case "owner":
      return "Ägare";
    case "admin":
      return "Administratör";
    case "member":
      return "Medlem";
    case "viewer":
      return "Läsare";
    default:
      return role;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AcceptInviteById() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const previewQuery = useQuery({
    queryKey: ["invitation-preview", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_invitation_preview", {
        _invitation_id: id!,
      });
      if (error) throw error;
      return data?.[0] ?? null;
    },
    retry: false,
  });

  const preview = previewQuery.data;
  const isExpired = preview && new Date(preview.expires_at) < new Date();
  const isConsumed = preview?.is_consumed;

  const onAccept = async () => {
    if (!id) return;
    setAccepting(true);
    setAcceptError(null);

    const { error } = await supabase.rpc("accept_invitation_by_id", {
      _invitation_id: id,
    });

    setAccepting(false);

    if (error) {
      setAcceptError(error.message);
      return;
    }

    setSuccess(true);
    queryClient.invalidateQueries();
    setTimeout(() => navigate("/team"), 1200);
  };

  return (
    <AppShell>
      <DashboardHeader
        title="Gå med i organisation"
        subtitle="Du har blivit inbjuden att gå med i en organisation."
      />

      <Card className="max-w-md">
        {previewQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-10 rounded-coin" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full mt-4" />
          </div>
        ) : previewQuery.isError ? (
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-coin bg-destructive/15 flex items-center justify-center shrink-0">
              <AlertCircle
                className="h-5 w-5 text-destructive"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Inbjudan kunde inte hittas
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Kontrollera att länken är korrekt eller att du är inloggad med rätt konto.
              </p>
            </div>
          </div>
        ) : success ? (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-coin bg-primary/15 flex items-center justify-center shrink-0">
              <Check className="h-5 w-5 text-primary" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Du är nu medlem</p>
              <p className="text-xs text-muted-foreground">Omdirigerar till team...</p>
            </div>
          </div>
        ) : isConsumed ? (
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-coin bg-muted flex items-center justify-center shrink-0">
              <Check className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Inbjudan redan använd
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Denna inbjudan har redan accepterats.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate("/team")}
                className="mt-3"
              >
                Gå till team
              </Button>
            </div>
          </div>
        ) : isExpired ? (
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-coin bg-destructive/15 flex items-center justify-center shrink-0">
              <Clock
                className="h-5 w-5 text-destructive"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Inbjudan har utgått</p>
              <p className="text-xs text-muted-foreground mt-1">
                Be om en ny inbjudan från organisationens administratör.
              </p>
            </div>
          </div>
        ) : preview ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-coin bg-primary/15 flex items-center justify-center shrink-0">
                <Users
                  className="h-5 w-5 text-primary"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{preview.org_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Roll: {roleLabel(preview.role)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Giltig till: {formatDate(preview.expires_at)}
                </p>
              </div>
            </div>

            <FormError>{acceptError}</FormError>

            <Button onClick={onAccept} disabled={accepting} className="w-full">
              {accepting ? "Går med..." : "Gå med i organisationen"}
            </Button>
          </div>
        ) : null}
      </Card>
    </AppShell>
  );
}

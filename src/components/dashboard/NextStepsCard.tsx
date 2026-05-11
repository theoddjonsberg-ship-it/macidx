import { UserPlus, Building2, UserCog, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ActionCard } from "@/components/dashboard/ActionCard";
import { useProfile } from "@/hooks/useProfile";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { useTeam } from "@/hooks/useTeam";
import { EmptyStateCard } from "@/components/dashboard/EmptyStateCard";

export function NextStepsCard() {
  const { data: profile, isLoading: pLoading } = useProfile();
  const { data: org, isLoading: oLoading } = useActiveOrg();
  const { data: members, isLoading: mLoading } = useTeam(org?.id);

  const loading = pLoading || oLoading || mLoading;

  if (loading) {
    return (
      <Card>
        <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
          Nästa steg
        </p>
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  const teamDone = (members?.length ?? 0) > 1;
  const orgDone = !!org && !!org.org_number && !!org.country;
  const accountDone = !!profile?.avatar_url;
  const allDone = teamDone && orgDone && accountDone;

  return (
    <Card>
      <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
        Nästa steg
      </p>
      {allDone ? (
        <EmptyStateCard
          icon={CheckCircle2}
          title="Allt klart"
          description="Grundsetup är slutförd. Aktivitet visas i feeden."
        />
      ) : (
        <div className="mt-3 -my-1">
          <ActionCard
            icon={UserPlus}
            title="Bjud in teammedlem"
            description="Lägg till kollegor med rollbaserad behörighet."
            href="/team"
            done={teamDone}
          />
          <ActionCard
            icon={Building2}
            title="Fyll i organisationsuppgifter"
            description="Komplettera org-nummer och land."
            href="/organization"
            done={orgDone}
          />
          <ActionCard
            icon={UserCog}
            title="Slutför konto"
            description="Lägg till en profilbild."
            href="/account"
            done={accountDone}
          />
        </div>
      )}
    </Card>
  );
}

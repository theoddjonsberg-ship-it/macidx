import { useState } from "react";
import { UserPlus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { FormError } from "@/components/ui/FormError";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { useTeam, useInvalidateTeam } from "@/hooks/useTeam";
import { useMyOrgRole } from "@/hooks/useMyOrgRole";
import { InviteForm } from "@/components/team/InviteForm";
import { MemberRow } from "@/components/team/MemberRow";

export function Team() {
  const { data: org, isLoading: orgLoading } = useActiveOrg();
  const { data: members, isLoading: teamLoading, isError, refetch } = useTeam(org?.id);
  const { data: myRole } = useMyOrgRole(org?.id);
  const invalidate = useInvalidateTeam(org?.id);
  const [inviteOpen, setInviteOpen] = useState(false);

  const canInvite = myRole === "owner" || myRole === "admin";

  return (
    <AppShell>
      <div className="mb-6">
        <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
          Team
        </p>
        <h1 className="text-2xl font-semibold mt-1">
          {orgLoading ? "…" : org?.name ?? "Ingen organisation"}
        </h1>
      </div>

      {canInvite && (
        <Card className="mb-6">
          {inviteOpen ? (
            <InviteForm
              orgId={org!.id}
              onClose={() => {
                setInviteOpen(false);
                invalidate();
              }}
            />
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => setInviteOpen(true)}
              className="inline-flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" strokeWidth={1.75} />
              Bjud in medlem
            </Button>
          )}
        </Card>
      )}

      <Card>
        <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
          Medlemmar
        </p>

        {teamLoading ? (
          <ul className="mt-3 space-y-3">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-8 w-20" />
              </li>
            ))}
          </ul>
        ) : isError ? (
          <div className="mt-3">
            <FormError>Kunde inte hämta medlemmar</FormError>
            <Button variant="secondary" size="sm" onClick={() => refetch()} className="mt-2">
              Försök igen
            </Button>
          </div>
        ) : !members || members.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-3">Inga medlemmar ännu.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {members.map((m) => (
              <MemberRow
                key={m.membership_id}
                member={m}
                orgId={org!.id}
                myRole={myRole ?? null}
                onChanged={() => invalidate()}
              />
            ))}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}

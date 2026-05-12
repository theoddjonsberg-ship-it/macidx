import { Building2, ShieldCheck, ArrowRightLeft, History, Lock } from "lucide-react";
import {
  useCurrentOwner,
  useOwnershipHistory,
  TRANSFER_METHOD_LABELS,
  formatDuration,
} from "@/hooks/useMachineOwnership";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import type { NormalizedMachine } from "@/types/machine";

interface MachineOwnershipProps {
  machine: NormalizedMachine;
  orgId: string;
  canManage: boolean;
}

export function MachineOwnership({ machine, orgId, canManage }: MachineOwnershipProps) {
  const { data: currentOwner, isLoading: ownerLoading } = useCurrentOwner(
    machine.id,
    orgId
  );
  const { data: history, isLoading: historyLoading } = useOwnershipHistory(machine.id);

  const isLoading = ownerLoading || historyLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <Skeleton className="h-24 w-full" />
        </Card>
        <Card>
          <Skeleton className="h-32 w-full" />
        </Card>
      </div>
    );
  }

  // Past owners (exclude current)
  const pastOwners = (history ?? []).filter((h) => h.to_date !== null);

  return (
    <div className="space-y-4">
      {/* Current Owner Card */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-control bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-6 w-6 text-primary" strokeWidth={1.75} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
              Nuvarande ägare
            </p>
            <h3 className="text-lg font-semibold text-foreground truncate">
              {currentOwner?.org_name ?? "Okänd organisation"}
            </h3>
            {currentOwner?.org_number && (
              <p className="text-xs text-muted-foreground/70 font-mono">
                Org.nr {currentOwner.org_number}
              </p>
            )}
            {currentOwner?.contact_person && (
              <p className="text-xs text-muted-foreground mt-1">
                Kontakt: {currentOwner.contact_person}
              </p>
            )}
            {currentOwner?.owner_since && (
              <p className="text-xs text-muted-foreground mt-1">
                Ägare sedan{" "}
                {new Date(currentOwner.owner_since).toLocaleDateString("sv-SE")}
                <span className="text-muted-foreground/50 mx-1.5">·</span>
                <span className="font-mono">
                  {formatDuration(currentOwner.owner_since, null)}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {canManage && (
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled
              title="Kommer i nästa prompt"
            >
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.75} />
              Verifiera ägarskap
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled
              title="Kommer i nästa prompt"
            >
              <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.75} />
              Initiera överlåtelse
            </Button>
          </div>
        )}
      </Card>

      {/* Ownership History */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <History className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          <h3 className="text-sm font-semibold text-foreground">Ägarhistorik</h3>
          {pastOwners.length > 0 && (
            <span className="text-xs text-muted-foreground font-mono ml-auto">
              {pastOwners.length} tidigare
            </span>
          )}
        </div>

        {pastOwners.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">Ingen tidigare ägare</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Historik byggs upp när ägarbyten genomförs.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border/50" />

            <div className="space-y-0">
              {pastOwners.map((row) => {
                const methodLabel = row.transfer_method
                  ? TRANSFER_METHOD_LABELS[row.transfer_method] ?? row.transfer_method
                  : null;

                return (
                  <div key={row.id} className="flex items-start gap-4 py-3 relative">
                    <div className="h-[15px] w-[15px] rounded-full bg-muted-foreground/40 flex-shrink-0 z-10 ring-2 ring-background" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground/60" strokeWidth={1.75} />
                        <p className="text-sm text-foreground font-medium truncate">
                          {row.organization?.name ?? "Okänd organisation"}
                        </p>
                        {methodLabel && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            <ShieldCheck className="h-2.5 w-2.5" strokeWidth={1.75} />
                            {methodLabel}
                          </span>
                        )}
                      </div>
                      {row.organization?.org_number && (
                        <p className="text-xs text-muted-foreground/60 font-mono">
                          Org.nr {row.organization.org_number}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(row.from_date).toLocaleDateString("sv-SE")} →{" "}
                        {row.to_date
                          ? new Date(row.to_date).toLocaleDateString("sv-SE")
                          : "pågående"}
                        <span className="text-muted-foreground/50 mx-1.5">·</span>
                        <span className="font-mono">
                          {formatDuration(row.from_date, row.to_date)}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Credit Lock Placeholder */}
      <Card>
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          <div>
            <p className="text-sm font-medium text-foreground">Kreditspärr-status</p>
            <p className="text-xs text-muted-foreground">Ingen aktiv spärr</p>
          </div>
          <span className="ml-auto text-xs text-muted-foreground/60">
            Kommer i framtida version
          </span>
        </div>
      </Card>
    </div>
  );
}

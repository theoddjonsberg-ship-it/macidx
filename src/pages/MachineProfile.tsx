import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useMachine } from "@/hooks/useMachines";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";

export function MachineProfile() {
  const { id } = useParams<{ id: string }>();
  const { data: machine, isLoading } = useMachine(id);

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <Card>
            <Skeleton className="h-32 w-full" />
          </Card>
        </div>
      </AppShell>
    );
  }

  if (!machine) {
    return (
      <AppShell>
        <DashboardHeader title="Maskin hittades inte" />
        <Card>
          <p className="text-sm text-muted-foreground">
            Maskinen finns inte eller så saknar du behörighet att se den.
          </p>
          <Link to="/machines" className="mt-4 inline-block">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1.5" strokeWidth={1.75} />
              Tillbaka till maskiner
            </Button>
          </Link>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-4">
        <Link to="/machines" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          Tillbaka
        </Link>
      </div>

      <DashboardHeader
        title={machine.name}
        subtitle={[machine.brand, machine.model].filter(Boolean).join(" ") || "Maskin"}
      />

      <Card>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">MachIndex ID</dt>
            <dd className="font-mono">{machine.machindexId || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Serienummer</dt>
            <dd className="font-mono">{machine.serialNumber || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Årsmodell</dt>
            <dd>{machine.year || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Drifttimmar</dt>
            <dd>{machine.operatingHours.toLocaleString("sv-SE")} h</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">MII-nivå</dt>
            <dd>{machine.miiLevel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Trust Score</dt>
            <dd>{machine.trustScore}%</dd>
          </div>
        </dl>

        <p className="mt-6 text-xs text-muted-foreground">
          Fullständig maskinprofil kommer i nästa prompt.
        </p>
      </Card>
    </AppShell>
  );
}

import { Link, useNavigate } from "react-router-dom";
import { Plus, Wrench, ChevronRight } from "lucide-react";
import { useMachines } from "@/hooks/useMachines";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  getCategoryIcon,
  getCategoryLabel,
  statusLabels,
  statusChipStyles,
  trustTone,
  miiLevelTone,
} from "@/lib/machine-utils";
import type { NormalizedMachine } from "@/types/machine";
import { cn } from "@/lib/utils";

function MachineRow({ machine: m, onClick }: { machine: NormalizedMachine; onClick: () => void }) {
  const Icon = getCategoryIcon(m.category);
  const subtitle = [m.brand, m.model].filter(Boolean).join(" ").trim() || getCategoryLabel(m.category);
  const serialLast4 = m.serialNumber ? m.serialNumber.slice(-4) : "—";

  return (
    <li
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group cursor-pointer transition-colors hover:bg-surface-track focus-visible:outline-none focus-visible:bg-surface-track"
    >
      {/* Desktop layout */}
      <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_100px_80px_80px_80px_28px] items-center gap-4 px-4 py-3">
        {/* Machine info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-control border border-border bg-surface-track text-muted-foreground">
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {m.name}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-1">{subtitle}</p>
          </div>
        </div>

        {/* Serial (last 4) */}
        <div className="text-xs font-mono text-muted-foreground">
          ...{serialLast4}
        </div>

        {/* MII Level */}
        <div>
          <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", miiLevelTone(m.miiLevel))}>
            {m.miiLevel}
          </span>
        </div>

        {/* Trust */}
        <div className={cn("text-sm font-semibold tabular-nums", trustTone(m.trustScore))}>
          {m.trustScore}%
        </div>

        {/* Status */}
        <div>
          <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium", statusChipStyles[m.status])}>
            {statusLabels[m.status]}
          </span>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors justify-self-end" strokeWidth={1.75} />
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden flex items-start gap-3 p-4">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-control border border-border bg-surface-track text-muted-foreground">
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                {m.name}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-1">{subtitle}</p>
            </div>
            <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium", statusChipStyles[m.status])}>
              {statusLabels[m.status]}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className={cn("font-medium", miiLevelTone(m.miiLevel).replace("bg-", "text-").replace("/15", "").replace("/10", ""))}>
              {m.miiLevel}
            </span>
            <span className={cn("font-semibold tabular-nums", trustTone(m.trustScore))}>
              {m.trustScore}% trust
            </span>
            <span className="font-mono">S/N ...{serialLast4}</span>
          </div>
        </div>
      </div>
    </li>
  );
}

function MachineListSkeleton() {
  return (
    <div className="overflow-hidden rounded-control border border-border bg-card">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-4 border-b border-border last:border-b-0">
          <Skeleton className="h-10 w-10 rounded-control" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-12" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-14 w-14 rounded-coin bg-muted flex items-center justify-center mb-4">
        <Wrench className="h-7 w-7 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-semibold text-foreground mb-1">Inga maskiner registrerade</p>
      <p className="text-xs text-muted-foreground mb-4">Lägg till din första maskin för att komma igång.</p>
      <Link to="/machines/add">
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1.5" strokeWidth={1.75} />
          Lägg till maskin
        </Button>
      </Link>
    </Card>
  );
}

export function Machines() {
  const navigate = useNavigate();
  const { data: machines, isLoading } = useMachines();

  return (
    <AppShell>
      <DashboardHeader
        title="Mina maskiner"
        subtitle="Hantera ditt maskinregister."
        actions={
          <Link to="/machines/add">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" strokeWidth={1.75} />
              Lägg till
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <MachineListSkeleton />
      ) : !machines || machines.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-control border border-border bg-card">
          {/* Desktop header */}
          <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_100px_80px_80px_80px_28px] items-center gap-4 border-b border-border px-4 py-2.5">
            <ColHeader>Maskin</ColHeader>
            <ColHeader>Serienr</ColHeader>
            <ColHeader>MII</ColHeader>
            <ColHeader>Trust</ColHeader>
            <ColHeader>Status</ColHeader>
            <span aria-hidden />
          </div>

          <ul className="divide-y divide-border">
            {machines.map((m) => (
              <MachineRow key={m.id} machine={m} onClick={() => navigate(`/machines/${m.id}`)} />
            ))}
          </ul>
        </div>
      )}
    </AppShell>
  );
}

function ColHeader({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
      {children}
    </span>
  );
}

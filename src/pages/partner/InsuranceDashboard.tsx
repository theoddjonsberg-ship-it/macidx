import { Link } from "react-router-dom";
import { Shield, TrendingDown, Clock, AlertTriangle, Building2, ChevronRight, MapPin } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { MIIBadge } from "@/components/machine/MIIBadge";
import { TrustGauge } from "@/components/machine/TrustGauge";
import {
  usePartnerPortfolio,
  usePortfolioStats,
  groupByCustomer,
  type PortfolioMachine,
} from "@/hooks/usePartnerPortfolio";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { MiiLevel } from "@/types/database";

// =============================================================================
// KPI Card Component
// =============================================================================
interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: "primary" | "trust" | "warning" | "destructive" | "muted";
}

function KpiCard({ icon: Icon, label, value, accent = "primary" }: KpiCardProps) {
  const accentClasses: Record<string, string> = {
    primary: "text-primary",
    trust: "text-primary",
    warning: "text-warning",
    destructive: "text-destructive",
    muted: "text-muted-foreground",
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-control bg-muted/50", accentClasses[accent])}>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className={cn("text-xl font-semibold tabular-nums mt-0.5", accentClasses[accent])}>{value}</p>
        </div>
      </div>
    </Card>
  );
}

// =============================================================================
// Attention Banner Component
// =============================================================================
interface AttentionBannerProps {
  machine: PortfolioMachine;
}

function AttentionBanner({ machine }: AttentionBannerProps) {
  return (
    <Card className="p-4 border-warning/50 bg-warning/5 mb-6">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-control bg-warning/10 text-warning shrink-0">
          <AlertTriangle className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Kräver uppmärksamhet</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            <Link to={`/machines/${machine.id}`} className="text-foreground hover:underline font-medium">
              {machine.name}
            </Link>
            {" "}hos {machine.organization?.name} har lägst trust score ({machine.trust_score}) i portföljen.
          </p>
        </div>
        <Link
          to={`/machines/${machine.id}`}
          className="shrink-0 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Visa <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
        </Link>
      </div>
    </Card>
  );
}

// =============================================================================
// MII Distribution Bar
// =============================================================================
interface MiiDistributionProps {
  byMiiLevel: Record<MiiLevel, number>;
  total: number;
}

function MiiDistribution({ byMiiLevel, total }: MiiDistributionProps) {
  if (total === 0) return null;

  const levels: MiiLevel[] = ["L0", "L1", "L2", "L3", "L4"];
  const colors: Record<MiiLevel, string> = {
    L0: "bg-muted-foreground",
    L1: "bg-warning",
    L2: "bg-warning/70",
    L3: "bg-primary/70",
    L4: "bg-primary",
  };

  return (
    <Card className="p-4 mb-6">
      <p className="text-sm font-medium text-foreground mb-3">MII-fördelning</p>
      <div className="flex h-3 rounded-full overflow-hidden bg-muted">
        {levels.map((level) => {
          const count = byMiiLevel[level] ?? 0;
          if (count === 0) return null;
          const pct = (count / total) * 100;
          return (
            <div
              key={level}
              className={cn(colors[level], "transition-all")}
              style={{ width: `${pct}%` }}
              title={`${level}: ${count} maskiner (${Math.round(pct)}%)`}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
        {levels.map((level) => (
          <div key={level} className="flex items-center gap-1">
            <span className={cn("w-2 h-2 rounded-full", colors[level])} />
            <span>{level}: {byMiiLevel[level] ?? 0}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// =============================================================================
// Customer Section Component
// =============================================================================
interface CustomerSectionProps {
  org: PortfolioMachine["organization"];
  machines: PortfolioMachine[];
}

function CustomerSection({ org, machines }: CustomerSectionProps) {
  const avgTrust = machines.length > 0
    ? Math.round(machines.reduce((sum, m) => sum + m.trust_score, 0) / machines.length)
    : 0;

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            <span className="font-medium text-foreground">{org?.name ?? "Okänd organisation"}</span>
            {org?.org_number && (
              <span className="text-xs text-muted-foreground">({org.org_number})</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{machines.length} maskiner</span>
            <span className="text-muted-foreground/50">|</span>
            <span className={cn(avgTrust >= 70 ? "text-primary" : avgTrust >= 50 ? "text-warning" : "text-muted-foreground")}>
              Snitt: {avgTrust}
            </span>
          </div>
        </div>
      </div>
      <div className="divide-y divide-border">
        {machines.map((machine) => (
          <MachineRow key={machine.id} machine={machine} />
        ))}
      </div>
    </Card>
  );
}

// =============================================================================
// Machine Row Component
// =============================================================================
interface MachineRowProps {
  machine: PortfolioMachine;
}

function MachineRow({ machine }: MachineRowProps) {
  const hasGps = !!(machine.latitude && machine.longitude && machine.last_gps_update);

  return (
    <Link
      to={`/machines/${machine.id}`}
      className="flex items-center gap-4 p-4 hover:bg-surface-track transition-colors"
    >
      {/* Trust Gauge */}
      <TrustGauge score={machine.trust_score} size="sm" />

      {/* Machine Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">{machine.name}</p>
          <MIIBadge level={machine.mii_level} />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {[machine.brand, machine.model, machine.year].filter(Boolean).join(" ")}
          {machine.serial_number && ` — ${machine.serial_number}`}
        </p>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center gap-3 shrink-0">
        {hasGps && (
          <div className="flex items-center gap-1 text-xs text-primary">
            <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>GPS</span>
          </div>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
      </div>
    </Link>
  );
}

// =============================================================================
// Empty State Component
// =============================================================================
function EmptyState() {
  return (
    <Card className="p-12 text-center">
      <Shield className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" strokeWidth={1.5} />
      <p className="text-sm font-medium text-foreground mb-1">Ingen data i portföljen</p>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        Det finns inga aktiva samtycken som ger åtkomst till maskindata.
        Kontakta dina kunder för att begära delning.
      </p>
    </Card>
  );
}

// =============================================================================
// Loading State Component
// =============================================================================
function LoadingState() {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-control" />
              <div className="flex-1">
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Skeleton className="h-16 w-full mb-6" />
      <Card>
        <div className="p-4 border-b border-border">
          <Skeleton className="h-5 w-48" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border-b border-border last:border-0">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-40 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}

// =============================================================================
// Main Component
// =============================================================================
export function InsuranceDashboard() {
  const { data: portfolio, isLoading } = usePartnerPortfolio();
  const stats = usePortfolioStats(portfolio);
  const byCustomer = groupByCustomer(portfolio ?? []);

  // Find lowest trust machine for attention banner
  const lowestTrustMachine = portfolio && portfolio.length > 0
    ? [...portfolio].sort((a, b) => a.trust_score - b.trust_score)[0]
    : null;

  if (isLoading) {
    return (
      <AppShell>
        <DashboardHeader title="Forsakringsoversikt" subtitle="Laddar portfolj..." />
        <LoadingState />
      </AppShell>
    );
  }

  if (!portfolio || portfolio.length === 0) {
    return (
      <AppShell>
        <DashboardHeader title="Forsakringsoversikt" subtitle="Ingen data tillganglig" />
        <EmptyState />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <DashboardHeader
        title="Forsakringsoversikt"
        subtitle={`${stats.total} forsakrade maskiner i din portfolj`}
      />

      {/* Hero KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard icon={Shield} label="Forsakrade maskiner" value={stats.total.toString()} />
        <KpiCard
          icon={TrendingDown}
          label="Snitt trust score"
          value={stats.avgTrust.toString()}
          accent={stats.avgTrust >= 70 ? "trust" : stats.avgTrust >= 50 ? "warning" : "destructive"}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Lag trust (< 50)"
          value={stats.lowTrustCount.toString()}
          accent={stats.lowTrustCount > 0 ? "warning" : "muted"}
        />
        <KpiCard icon={Clock} label="Forfall 30 dgr" value={stats.expiringCount.toString()} />
      </div>

      {/* Attention Banner */}
      {lowestTrustMachine && lowestTrustMachine.trust_score < 50 && (
        <AttentionBanner machine={lowestTrustMachine} />
      )}

      {/* MII Distribution */}
      <MiiDistribution byMiiLevel={stats.byMiiLevel} total={stats.total} />

      {/* Customer Sections */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Kunder ({Object.keys(byCustomer).length})
        </h2>
        {Object.entries(byCustomer).map(([orgId, { org, machines }]) => (
          <CustomerSection key={orgId} org={org} machines={machines} />
        ))}
      </div>
    </AppShell>
  );
}

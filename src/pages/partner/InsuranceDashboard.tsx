import { Link } from "react-router-dom";
import { Shield, TrendingDown, Clock, AlertTriangle, Building2, ChevronRight, MapPin, Eye } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { MIIBadge } from "@/components/machine/MIIBadge";
import { TrustGauge } from "@/components/machine/TrustGauge";
import { usePartnerPortfolio, type PortfolioMachine } from "@/hooks/usePartnerPortfolio";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

// =============================================================================
// Risk Flags
// =============================================================================
interface RiskFlag {
  severity: "red" | "yellow" | "green";
  label: string;
}

function getRiskFlags(m: PortfolioMachine): RiskFlag[] {
  const flags: RiskFlag[] = [];
  if (m.mii_level === "L0" || m.mii_level === "L1") {
    flags.push({ severity: "red", label: "Otillracklig verifiering" });
  }
  if (!m.latitude) {
    flags.push({ severity: "yellow", label: "Ingen GPS" });
  }
  if (m.trust_score < 40) {
    flags.push({ severity: "red", label: "Lag trust" });
  } else if (m.trust_score < 70) {
    flags.push({ severity: "yellow", label: "Medel trust" });
  } else {
    flags.push({ severity: "green", label: "God verifiering" });
  }
  return flags.slice(0, 3);
}

const flagStyles: Record<RiskFlag["severity"], string> = {
  red: "bg-destructive/10 text-destructive border-destructive/30",
  yellow: "bg-warning/10 text-warning border-warning/30",
  green: "bg-primary/10 text-primary border-primary/30",
};

function RiskChip({ flag }: { flag: RiskFlag }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap",
        flagStyles[flag.severity]
      )}
    >
      {flag.label}
    </span>
  );
}

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
function AttentionBanner({ machine }: { machine: PortfolioMachine }) {
  return (
    <Card className="p-4 border-warning/50 bg-warning/5 mb-6">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-control bg-warning/10 text-warning shrink-0">
          <AlertTriangle className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Kraver uppmarksamhet</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            <Link to={`/machines/${machine.id}`} className="text-foreground hover:underline font-medium">
              {machine.name}
            </Link>
            {" "}hos {machine.organization?.name} har lagst trust score ({machine.trust_score}) i portfoljen.
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
// Customer Section with Table
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
      {/* Customer Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            <span className="font-medium text-foreground">{org?.name ?? "Okand organisation"}</span>
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

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Maskin</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Serienr</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">MII</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Trust</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Risk</th>
              <th className="text-right px-4 py-2 font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {machines.map((machine) => (
              <MachineTableRow key={machine.id} machine={machine} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-border">
        {machines.map((machine) => (
          <MachineCard key={machine.id} machine={machine} />
        ))}
      </div>
    </Card>
  );
}

// =============================================================================
// Machine Table Row (Desktop)
// =============================================================================
function MachineTableRow({ machine }: { machine: PortfolioMachine }) {
  const flags = getRiskFlags(machine);
  const serialLast4 = machine.serial_number ? machine.serial_number.slice(-4) : "—";

  return (
    <tr className="hover:bg-surface-track transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div>
            <p className="font-medium text-foreground">{machine.brand} {machine.model}</p>
            <p className="text-xs text-muted-foreground">{machine.name}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
        ...{serialLast4}
      </td>
      <td className="px-4 py-3">
        <MIIBadge level={machine.mii_level} />
      </td>
      <td className="px-4 py-3">
        <TrustGauge score={machine.trust_score} size="sm" />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 flex-wrap">
          {flags.map((flag, i) => (
            <RiskChip key={i} flag={flag} />
          ))}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/machines/${machine.id}`}>
            <Eye className="h-4 w-4 mr-1.5" strokeWidth={1.75} />
            Visa
          </Link>
        </Button>
      </td>
    </tr>
  );
}

// =============================================================================
// Machine Card (Mobile)
// =============================================================================
function MachineCard({ machine }: { machine: PortfolioMachine }) {
  const flags = getRiskFlags(machine);
  const hasGps = !!(machine.latitude && machine.longitude);

  return (
    <Link
      to={`/machines/${machine.id}`}
      className="flex items-center gap-4 p-4 hover:bg-surface-track transition-colors"
    >
      <TrustGauge score={machine.trust_score} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground">
            {machine.brand} {machine.model}
          </p>
          <MIIBadge level={machine.mii_level} />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{machine.name}</p>
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {flags.slice(0, 2).map((flag, i) => (
            <RiskChip key={i} flag={flag} />
          ))}
          {hasGps && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-primary">
              <MapPin className="h-3 w-3" strokeWidth={1.75} />
              GPS
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.75} />
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
      <p className="text-sm font-medium text-foreground mb-1">Inga aktiva samtycken</p>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        Nar maskinagare delar sina maskiner med er dyker de upp har.
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
      {/* KPI Skeletons */}
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

      {/* Table Skeleton */}
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
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}

// =============================================================================
// Helper Functions
// =============================================================================
function groupByCustomer(
  portfolio: PortfolioMachine[]
): Record<string, { org: PortfolioMachine["organization"]; machines: PortfolioMachine[] }> {
  return portfolio.reduce(
    (acc, m) => {
      const orgId = m.org_id;
      if (!acc[orgId]) {
        acc[orgId] = { org: m.organization, machines: [] };
      }
      acc[orgId].machines.push(m);
      return acc;
    },
    {} as Record<string, { org: PortfolioMachine["organization"]; machines: PortfolioMachine[] }>
  );
}

function calculateStats(portfolio: PortfolioMachine[]) {
  const total = portfolio.length;
  const avgTrust = total > 0
    ? Math.round(portfolio.reduce((sum, m) => sum + m.trust_score, 0) / total)
    : 0;
  const lowTrustCount = portfolio.filter((m) => m.trust_score < 50).length;

  // Count consents expiring in 30 days
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const expiringCount = portfolio.filter((m) => {
    if (!m.consent?.expires_at) return false;
    const expiry = new Date(m.consent.expires_at).getTime();
    return expiry > now && expiry < now + thirtyDays;
  }).length;

  return { total, avgTrust, lowTrustCount, expiringCount };
}

// =============================================================================
// Main Component
// =============================================================================
export function InsuranceDashboard() {
  const { data: portfolio, isLoading } = usePartnerPortfolio();
  const stats = calculateStats(portfolio ?? []);
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

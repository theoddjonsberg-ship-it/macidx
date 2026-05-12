import { Link } from "react-router-dom";
import { Shield, TrendingDown, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { KpiCard } from "@/components/partner/KpiCard";
import { CustomerPortfolioSection } from "@/components/partner/CustomerPortfolioSection";
import { getInsuranceRiskFlags } from "@/components/partner/RiskFlagChips";
import { usePartnerPortfolio, type PortfolioMachine } from "@/hooks/usePartnerPortfolio";

// =============================================================================
// Helpers
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
// Attention Banner
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
// Empty State
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
// Loading State
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
          <CustomerPortfolioSection
            key={orgId}
            org={org}
            machines={machines}
            getRiskFlags={getInsuranceRiskFlags}
            variant="insurance"
          />
        ))}
      </div>
    </AppShell>
  );
}

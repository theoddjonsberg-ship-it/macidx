import { Link } from "react-router-dom";
import { Banknote, TrendingUp, AlertTriangle, Clock, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { KpiCard } from "@/components/partner/KpiCard";
import { CustomerPortfolioSection } from "@/components/partner/CustomerPortfolioSection";
import { getFinanceRiskFlags } from "@/components/partner/RiskFlagChips";
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

function calculatePortfolioValue(portfolio: PortfolioMachine[]): number {
  const FALLBACK_VALUE = 350_000; // 350k SEK per machine as demo fallback
  return portfolio.reduce((sum, m) => {
    return sum + (m.estimated_residual_value ?? FALLBACK_VALUE);
  }, 0);
}

function formatPortfolioValue(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)} MSEK`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)} tkr`;
  }
  return `${value} kr`;
}

function formatCustomerPortfolioValue(machines: PortfolioMachine[]): string {
  const value = calculatePortfolioValue(machines);
  return formatPortfolioValue(value);
}

function calculateStats(portfolio: PortfolioMachine[]) {
  const total = portfolio.length;
  const portfolioValue = calculatePortfolioValue(portfolio);

  // Risk machines: trust < 50 OR mii_level L0/L1
  const riskCount = portfolio.filter(
    (m) => m.trust_score < 50 || m.mii_level === "L0" || m.mii_level === "L1"
  ).length;

  // Count consents expiring in 90 days
  const now = Date.now();
  const ninetyDays = 90 * 24 * 60 * 60 * 1000;
  const expiringCount = portfolio.filter((m) => {
    if (!m.consent?.expires_at) return false;
    const expiry = new Date(m.consent.expires_at).getTime();
    return expiry > now && expiry < now + ninetyDays;
  }).length;

  // Count unique customer orgs
  const customerCount = new Set(portfolio.map((m) => m.org_id)).size;

  return { total, portfolioValue, riskCount, expiringCount, customerCount };
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
          <p className="text-sm font-medium text-foreground">Hog risk</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            <Link to={`/machines/${machine.id}`} className="text-foreground hover:underline font-medium">
              {machine.brand} {machine.model}
            </Link>
            {" "}hos {machine.organization?.name} har lag verifieringsniva ({machine.mii_level}) och trust score {machine.trust_score}.
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
      <Banknote className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" strokeWidth={1.5} />
      <p className="text-sm font-medium text-foreground mb-1">Inga aktiva samtycken</p>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        Nar maskinagare delar sin portfolj med er dyker maskinerna upp har som finansieringsunderlag.
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
                <Skeleton className="h-6 w-16" />
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
export function FinanceDashboard() {
  const { data: portfolio, isLoading } = usePartnerPortfolio();
  const stats = calculateStats(portfolio ?? []);
  const byCustomer = groupByCustomer(portfolio ?? []);

  // Find highest risk machine for attention banner
  const highestRiskMachine = portfolio && portfolio.length > 0
    ? [...portfolio]
        .filter((m) => m.mii_level === "L0" || m.mii_level === "L1" || m.trust_score < 40)
        .sort((a, b) => a.trust_score - b.trust_score)[0]
    : null;

  if (isLoading) {
    return (
      <AppShell>
        <DashboardHeader title="Finansportfolj" subtitle="Laddar portfolj..." />
        <LoadingState />
      </AppShell>
    );
  }

  if (!portfolio || portfolio.length === 0) {
    return (
      <AppShell>
        <DashboardHeader title="Finansportfolj" subtitle="Ingen data tillganglig" />
        <EmptyState />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <DashboardHeader
        title="Finansportfolj"
        subtitle={`${stats.total} aktiva avtal i ${stats.customerCount} kundorganisationer`}
      />

      {/* Hero KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard
          icon={Banknote}
          label="Aktiva avtal"
          value={stats.total.toString()}
        />
        <KpiCard
          icon={TrendingUp}
          label="Portfoljvarde"
          value={formatPortfolioValue(stats.portfolioValue)}
          accent="primary"
          mono
        />
        <KpiCard
          icon={AlertTriangle}
          label="Riskmaskiner"
          value={stats.riskCount.toString()}
          accent={stats.riskCount > 0 ? "warning" : "muted"}
        />
        <KpiCard
          icon={Clock}
          label="Forfall 90 dgr"
          value={stats.expiringCount.toString()}
        />
      </div>

      {/* Attention Banner */}
      {highestRiskMachine && (
        <AttentionBanner machine={highestRiskMachine} />
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
            getRiskFlags={getFinanceRiskFlags}
            variant="finance"
            portfolioValue={formatCustomerPortfolioValue(machines)}
          />
        ))}
      </div>
    </AppShell>
  );
}

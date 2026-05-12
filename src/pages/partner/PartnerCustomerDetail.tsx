import { useMemo } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import {
  Building2,
  Mail,
  Phone,
  User,
  AlertTriangle,
  ChevronLeft,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { KpiCard } from "@/components/partner/KpiCard";
import { CustomerPortfolioSection } from "@/components/partner/CustomerPortfolioSection";
import { getFinanceRiskFlags, getInsuranceRiskFlags } from "@/components/partner/RiskFlagChips";
import { TrustGauge } from "@/components/machine/TrustGauge";
import { usePartnerCustomers, type PartnerCustomer } from "@/hooks/usePartnerCustomers";
import { usePartnerPortfolio, type PortfolioMachine } from "@/hooks/usePartnerPortfolio";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { CONSENT_LEVEL_LABELS } from "@/hooks/useMachineConsents";
import { cn } from "@/lib/utils";
import type { MiiLevel } from "@/types/database";

// =============================================================================
// Helpers
// =============================================================================
function formatPortfolioValue(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)} MSEK`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)} tkr`;
  }
  return `${value} kr`;
}

const MII_COLORS: Record<MiiLevel, string> = {
  L0: "bg-destructive",
  L1: "bg-warning",
  L2: "bg-amber-400",
  L3: "bg-primary/70",
  L4: "bg-primary",
};


// =============================================================================
// Loading State
// =============================================================================
function LoadingState() {
  return (
    <AppShell>
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-8 w-8 rounded-control" />
        <Skeleton className="h-6 w-48" />
      </div>
      <Card className="p-6 mb-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-control" />
          <div className="flex-1">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16" />
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

// =============================================================================
// Customer Header Card
// =============================================================================
function CustomerHeader({
  customer,
}: {
  customer: PartnerCustomer;
}) {
  return (
    <Card className="p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="h-16 w-16 rounded-control bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Building2 className="h-8 w-8 text-primary" strokeWidth={1.5} />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-foreground">{customer.org_name}</h2>
          {customer.org_number && (
            <p className="text-sm text-muted-foreground mt-0.5">{customer.org_number}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
            {customer.contact_person && (
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" strokeWidth={1.75} />
                <span>{customer.contact_person}</span>
              </div>
            )}
            {customer.contact_email && (
              <div className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" strokeWidth={1.75} />
                <span>{customer.contact_email}</span>
              </div>
            )}
            {customer.contact_phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-4 w-4" strokeWidth={1.75} />
                <span>{customer.contact_phone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {customer.contact_email && (
            <Button variant="secondary" size="sm" asChild>
              <a href={`mailto:${customer.contact_email}`}>
                <Mail className="h-4 w-4 mr-1.5" strokeWidth={1.75} />
                Maila
              </a>
            </Button>
          )}
          {customer.contact_phone && (
            <Button variant="secondary" size="sm" asChild>
              <a href={`tel:${customer.contact_phone}`}>
                <Phone className="h-4 w-4 mr-1.5" strokeWidth={1.75} />
                Ring
              </a>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// =============================================================================
// MII Distribution Bar
// =============================================================================
function MiiDistributionBar({ machines }: { machines: PortfolioMachine[] }) {
  const distribution = useMemo(() => {
    const counts: Record<MiiLevel, number> = { L0: 0, L1: 0, L2: 0, L3: 0, L4: 0 };
    machines.forEach((m) => {
      counts[m.mii_level]++;
    });
    return counts;
  }, [machines]);

  const total = machines.length;
  if (total === 0) return null;

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium text-foreground mb-3">Riskfordelning (MII-niva)</h3>

      {/* Stacked bar */}
      <div className="h-6 rounded-control overflow-hidden flex">
        {(["L0", "L1", "L2", "L3", "L4"] as MiiLevel[]).map((level) => {
          const count = distribution[level];
          if (count === 0) return null;
          const pct = (count / total) * 100;
          return (
            <div
              key={level}
              className={cn(MII_COLORS[level], "h-full")}
              style={{ width: `${pct}%` }}
              title={`${level}: ${count} st (${Math.round(pct)}%)`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs">
        {(["L0", "L1", "L2", "L3", "L4"] as MiiLevel[]).map((level) => {
          const count = distribution[level];
          if (count === 0) return null;
          return (
            <div key={level} className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", MII_COLORS[level])} />
              <span className="text-muted-foreground">
                {level}: {count} st
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// =============================================================================
// Attention List
// =============================================================================
function AttentionList({ machines }: { machines: PortfolioMachine[] }) {
  const lowTrustMachines = useMemo(() => {
    return [...machines]
      .filter((m) => m.trust_score < 50)
      .sort((a, b) => a.trust_score - b.trust_score)
      .slice(0, 3);
  }, [machines]);

  if (lowTrustMachines.length === 0) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-warning" strokeWidth={1.75} />
        <h3 className="text-sm font-medium text-foreground">Kraver uppmarksamhet</h3>
      </div>

      <div className="space-y-2">
        {lowTrustMachines.map((machine) => (
          <Link
            key={machine.id}
            to={`/machines/${machine.id}`}
            className="flex items-center gap-3 p-2 rounded-control hover:bg-surface-track transition-colors"
          >
            <TrustGauge score={machine.trust_score} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {machine.brand} {machine.model}
              </p>
              <p className="text-xs text-muted-foreground truncate">{machine.name}</p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
          </Link>
        ))}
      </div>
    </Card>
  );
}

// =============================================================================
// Active Consents Table
// =============================================================================
function ConsentsTable({ machines }: { machines: PortfolioMachine[] }) {
  // Get unique consents from machines
  const consents = useMemo(() => {
    const seen = new Set<string>();
    const result: Array<{
      level: number;
      purpose: string | null;
      granted_at: string;
      expires_at: string | null;
    }> = [];

    machines.forEach((m) => {
      if (m.consent) {
        const key = `${m.consent.consent_level}-${m.consent.granted_at}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({
            level: m.consent.consent_level,
            purpose: null, // Not available in portfolio data
            granted_at: m.consent.granted_at,
            expires_at: m.consent.expires_at,
          });
        }
      }
    });

    return result.sort((a, b) => b.level - a.level);
  }, [machines]);

  if (consents.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/30">
        <h3 className="text-sm font-medium text-foreground">Aktiva samtycken</h3>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/10">
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Niva</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Beviljat</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Forfall</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {consents.map((consent, i) => {
            const expiresAt = consent.expires_at ? new Date(consent.expires_at) : null;
            const now = new Date();
            const isExpiringSoon = expiresAt && (expiresAt.getTime() - now.getTime()) < 30 * 24 * 60 * 60 * 1000;
            const isExpired = expiresAt && expiresAt < now;

            return (
              <tr key={i}>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                      consent.level === 3 && "bg-primary/10 text-primary border-primary/30",
                      consent.level === 2 && "bg-primary/5 text-primary/80 border-primary/20",
                      consent.level === 1 && "bg-muted text-muted-foreground border-border"
                    )}
                  >
                    {CONSENT_LEVEL_LABELS[consent.level] ?? `Niva ${consent.level}`}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(consent.granted_at).toLocaleDateString("sv-SE")}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {expiresAt ? expiresAt.toLocaleDateString("sv-SE") : "Tills vidare"}
                </td>
                <td className="px-4 py-3">
                  {isExpired ? (
                    <span className="text-xs text-destructive font-medium">Forfallit</span>
                  ) : isExpiringSoon ? (
                    <span className="text-xs text-warning font-medium">Snart forfall</span>
                  ) : (
                    <span className="text-xs text-primary font-medium">Aktiv</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

// =============================================================================
// Main Component
// =============================================================================
export function PartnerCustomerDetail() {
  const { orgId } = useParams<{ orgId: string }>();
  const { data: customers, isLoading: customersLoading } = usePartnerCustomers();
  const { data: portfolio, isLoading: portfolioLoading } = usePartnerPortfolio();
  const { data: activeOrg } = useActiveOrg();

  const isLoading = customersLoading || portfolioLoading;

  const customer = useMemo(() => {
    return customers?.find((c) => c.org_id === orgId);
  }, [customers, orgId]);

  const customerMachines = useMemo(() => {
    return portfolio?.filter((m) => m.org_id === orgId) ?? [];
  }, [portfolio, orgId]);

  // Security guard - if no consent, redirect to 403
  if (!isLoading && !customer) {
    return <Navigate to="/403" replace />;
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (!customer) {
    return <Navigate to="/403" replace />;
  }

  const orgType = activeOrg?.org_type ?? "insurance";
  const isFinance = orgType === "finance" || orgType === "leasing";
  const getRiskFlags = isFinance ? getFinanceRiskFlags : getInsuranceRiskFlags;

  const avgTrust =
    customerMachines.length > 0
      ? Math.round(customerMachines.reduce((sum, m) => sum + m.trust_score, 0) / customerMachines.length)
      : 0;

  const totalValue = customerMachines.reduce(
    (sum, m) => sum + (m.estimated_residual_value ?? 350000),
    0
  );

  return (
    <AppShell>
      {/* Back link */}
      <Link
        to="/partner/customers"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
        Tillbaka till kunder
      </Link>

      <DashboardHeader
        title={customer.org_name}
        subtitle={customer.org_number ?? undefined}
      />

      {/* Customer Header */}
      <CustomerHeader customer={customer} />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard
          icon={Building2}
          label="Antal maskiner"
          value={customerMachines.length.toString()}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Snitt trust"
          value={avgTrust.toString()}
          accent={avgTrust >= 70 ? "trust" : avgTrust >= 50 ? "warning" : "destructive"}
        />
        <KpiCard
          icon={Building2}
          label="Aktiva consents"
          value={customer.consent_levels.length.toString()}
        />
        {isFinance && (
          <KpiCard
            icon={Building2}
            label="Restvarde"
            value={formatPortfolioValue(totalValue)}
            mono
          />
        )}
      </div>

      {/* Risk Summary */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <MiiDistributionBar machines={customerMachines} />
        <AttentionList machines={customerMachines} />
      </div>

      {/* Active Consents */}
      <div className="mb-6">
        <ConsentsTable machines={customerMachines} />
      </div>

      {/* All Machines */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Alla maskiner ({customerMachines.length})
        </h2>
        <CustomerPortfolioSection
          org={{
            id: customer.org_id,
            name: customer.org_name,
            org_number: customer.org_number,
            contact_person: customer.contact_person,
          }}
          machines={customerMachines}
          getRiskFlags={getRiskFlags}
          variant={isFinance ? "finance" : "insurance"}
          portfolioValue={isFinance ? formatPortfolioValue(totalValue) : undefined}
        />
      </div>
    </AppShell>
  );
}

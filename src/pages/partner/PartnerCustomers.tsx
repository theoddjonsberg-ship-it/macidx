import { Link } from "react-router-dom";
import { Building2, ChevronRight, Clock } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { TrustGauge } from "@/components/machine/TrustGauge";
import { usePartnerCustomers, type PartnerCustomer } from "@/hooks/usePartnerCustomers";
import { cn } from "@/lib/utils";

// =============================================================================
// Helpers
// =============================================================================
function formatExpiryStatus(expiresAt: string | null): { label: string; isWarning: boolean } {
  if (!expiresAt) {
    return { label: "Tills vidare", isWarning: false };
  }

  const now = Date.now();
  const expiry = new Date(expiresAt).getTime();
  const daysUntil = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) {
    return { label: "Forfallit", isWarning: true };
  }

  if (daysUntil <= 30) {
    return { label: `${daysUntil} dgr`, isWarning: true };
  }

  return {
    label: new Date(expiresAt).toLocaleDateString("sv-SE"),
    isWarning: false,
  };
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

// =============================================================================
// Empty State
// =============================================================================
function EmptyState() {
  return (
    <Card className="p-12 text-center">
      <Building2 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" strokeWidth={1.5} />
      <p className="text-sm font-medium text-foreground mb-1">Inga kunder</p>
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
      {/* Desktop */}
      <Card className="hidden md:block">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-5 w-32" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border-b border-border last:border-0">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-control" />
              <div className="flex-1">
                <Skeleton className="h-4 w-40 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        ))}
      </Card>

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-control" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

// =============================================================================
// Customer Table Row (Desktop)
// =============================================================================
function CustomerRow({ customer }: { customer: PartnerCustomer }) {
  const { label: expiryLabel, isWarning } = formatExpiryStatus(customer.earliest_expiry);

  return (
    <Link
      to={`/partner/customers/${customer.org_id}`}
      className="flex items-center gap-4 p-4 border-b border-border last:border-0 hover:bg-surface-track transition-colors"
    >
      <div className="h-10 w-10 rounded-control bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Building2 className="h-5 w-5 text-primary" strokeWidth={1.75} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{customer.org_name}</p>
        {customer.org_number && (
          <p className="text-xs text-muted-foreground">{customer.org_number}</p>
        )}
      </div>

      <div className="text-right">
        <p className="text-sm font-medium text-foreground">{customer.machine_count}</p>
        <p className="text-[10px] text-muted-foreground uppercase">maskiner</p>
      </div>

      <div className="w-16">
        <TrustGauge score={customer.avg_trust_score} size="sm" />
      </div>

      <div className="flex items-center gap-1">
        {customer.consent_levels.sort().map((level) => (
          <span
            key={level}
            className={cn(
              "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
              level === 3 && "bg-primary/10 text-primary border-primary/30",
              level === 2 && "bg-primary/5 text-primary/80 border-primary/20",
              level === 1 && "bg-muted text-muted-foreground border-border"
            )}
          >
            Niva {level}
          </span>
        ))}
      </div>

      <div className="w-24 text-right">
        <p
          className={cn(
            "text-sm",
            isWarning ? "text-warning font-medium" : "text-muted-foreground"
          )}
        >
          {expiryLabel}
        </p>
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" strokeWidth={1.75} />
    </Link>
  );
}

// =============================================================================
// Customer Card (Mobile)
// =============================================================================
function CustomerCard({ customer }: { customer: PartnerCustomer }) {
  const { label: expiryLabel, isWarning } = formatExpiryStatus(customer.earliest_expiry);

  return (
    <Link
      to={`/partner/customers/${customer.org_id}`}
      className="block"
    >
      <Card className="p-4 hover:bg-surface-track transition-colors">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-control bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5 text-primary" strokeWidth={1.75} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{customer.org_name}</p>
            {customer.org_number && (
              <p className="text-xs text-muted-foreground">{customer.org_number}</p>
            )}

            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>{customer.machine_count} maskiner</span>
              <span>·</span>
              <span className={cn(customer.avg_trust_score >= 70 ? "text-primary" : customer.avg_trust_score >= 50 ? "text-warning" : "text-muted-foreground")}>
                Trust {customer.avg_trust_score}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2">
              {customer.consent_levels.sort().map((level) => (
                <span
                  key={level}
                  className={cn(
                    "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                    level === 3 && "bg-primary/10 text-primary border-primary/30",
                    level === 2 && "bg-primary/5 text-primary/80 border-primary/20",
                    level === 1 && "bg-muted text-muted-foreground border-border"
                  )}
                >
                  Niva {level}
                </span>
              ))}

              {isWarning && (
                <span className="inline-flex items-center gap-1 text-[10px] text-warning">
                  <Clock className="h-3 w-3" strokeWidth={1.75} />
                  {expiryLabel}
                </span>
              )}
            </div>
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" strokeWidth={1.75} />
        </div>
      </Card>
    </Link>
  );
}

// =============================================================================
// Main Component
// =============================================================================
export function PartnerCustomers() {
  const { data: customers, isLoading } = usePartnerCustomers();

  if (isLoading) {
    return (
      <AppShell>
        <DashboardHeader title="Kunder" subtitle="Laddar kunder..." />
        <LoadingState />
      </AppShell>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <AppShell>
        <DashboardHeader title="Kunder" subtitle="Inga kunder med aktivt samtycke" />
        <EmptyState />
      </AppShell>
    );
  }

  const totalMachines = customers.reduce((sum, c) => sum + c.machine_count, 0);
  const totalValue = customers.reduce((sum, c) => sum + c.total_residual_value, 0);

  return (
    <AppShell>
      <DashboardHeader
        title="Kunder"
        subtitle={`${customers.length} kunder med aktivt samtycke • ${totalMachines} maskiner • ${formatPortfolioValue(totalValue)}`}
      />

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Organisation
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Maskiner
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Trust
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Consent
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Forfall
              </th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <CustomerRow key={customer.org_id} customer={customer} />
            ))}
          </tbody>
        </table>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {customers.map((customer) => (
          <CustomerCard key={customer.org_id} customer={customer} />
        ))}
      </div>
    </AppShell>
  );
}

import { Link } from "react-router-dom";
import { Building2, ChevronRight, MapPin, Eye } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MIIBadge } from "@/components/machine/MIIBadge";
import { TrustGauge } from "@/components/machine/TrustGauge";
import { RiskFlagChips, type RiskFlag } from "./RiskFlagChips";
import { cn } from "@/lib/utils";
import type { PortfolioMachine } from "@/hooks/usePartnerPortfolio";

interface CustomerSectionProps {
  org: PortfolioMachine["organization"];
  machines: PortfolioMachine[];
  getRiskFlags: (m: PortfolioMachine) => RiskFlag[];
  variant?: "insurance" | "finance";
  portfolioValue?: string;
}

export function CustomerPortfolioSection({
  org,
  machines,
  getRiskFlags,
  variant = "insurance",
  portfolioValue,
}: CustomerSectionProps) {
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
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <span>{machines.length} maskiner</span>
            {portfolioValue && (
              <>
                <span className="text-muted-foreground/50">|</span>
                <span className="font-mono text-xs">{portfolioValue}</span>
              </>
            )}
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
              {variant === "finance" && (
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Restvarde</th>
              )}
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Risk</th>
              <th className="text-right px-4 py-2 font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {machines.map((machine) => (
              <MachineTableRow
                key={machine.id}
                machine={machine}
                getRiskFlags={getRiskFlags}
                variant={variant}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-border">
        {machines.map((machine) => (
          <MachineCard
            key={machine.id}
            machine={machine}
            getRiskFlags={getRiskFlags}
            variant={variant}
          />
        ))}
      </div>
    </Card>
  );
}

// =============================================================================
// Machine Table Row (Desktop)
// =============================================================================
interface MachineRowProps {
  machine: PortfolioMachine;
  getRiskFlags: (m: PortfolioMachine) => RiskFlag[];
  variant: "insurance" | "finance";
}

function MachineTableRow({ machine, getRiskFlags, variant }: MachineRowProps) {
  const flags = getRiskFlags(machine);
  const serialLast4 = machine.serial_number ? machine.serial_number.slice(-4) : "—";

  return (
    <tr className="hover:bg-surface-track transition-colors">
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-foreground">{machine.brand} {machine.model}</p>
          <p className="text-xs text-muted-foreground">{machine.name}</p>
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
      {variant === "finance" && (
        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
          {formatResidualValue(machine.estimated_residual_value)}
        </td>
      )}
      <td className="px-4 py-3">
        <RiskFlagChips flags={flags} />
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
function MachineCard({ machine, getRiskFlags, variant }: MachineRowProps) {
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
        {variant === "finance" && machine.estimated_residual_value && (
          <p className="text-xs font-mono text-muted-foreground mt-0.5">
            {formatResidualValue(machine.estimated_residual_value)}
          </p>
        )}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {flags.slice(0, 2).map((flag, i) => (
            <span
              key={i}
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                flag.severity === "red" && "bg-destructive/10 text-destructive border-destructive/30",
                flag.severity === "yellow" && "bg-warning/10 text-warning border-warning/30",
                flag.severity === "green" && "bg-primary/10 text-primary border-primary/30"
              )}
            >
              {flag.label}
            </span>
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
// Helpers
// =============================================================================
function formatResidualValue(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)} MSEK`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)} tkr`;
  }
  return `${value} kr`;
}

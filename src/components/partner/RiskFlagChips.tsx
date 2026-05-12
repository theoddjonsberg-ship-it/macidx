import { cn } from "@/lib/utils";
import type { PortfolioMachine } from "@/hooks/usePartnerPortfolio";

export interface RiskFlag {
  severity: "red" | "yellow" | "green";
  label: string;
}

const flagStyles: Record<RiskFlag["severity"], string> = {
  red: "bg-destructive/10 text-destructive border-destructive/30",
  yellow: "bg-warning/10 text-warning border-warning/30",
  green: "bg-primary/10 text-primary border-primary/30",
};

export function RiskChip({ flag }: { flag: RiskFlag }) {
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

export function RiskFlagChips({ flags, max = 3 }: { flags: RiskFlag[]; max?: number }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {flags.slice(0, max).map((flag, i) => (
        <RiskChip key={i} flag={flag} />
      ))}
    </div>
  );
}

// Insurance-specific risk flags
export function getInsuranceRiskFlags(m: PortfolioMachine): RiskFlag[] {
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

// Finance-specific risk flags
export function getFinanceRiskFlags(m: PortfolioMachine): RiskFlag[] {
  const flags: RiskFlag[] = [];
  if (m.mii_level === "L0" || m.mii_level === "L1") {
    flags.push({ severity: "red", label: "Oregistrerad" });
  }
  if (m.trust_score < 40) {
    flags.push({ severity: "red", label: "Hog risk" });
  } else if (m.trust_score < 70) {
    flags.push({ severity: "yellow", label: "Medel risk" });
  }
  if (!m.latitude) {
    flags.push({ severity: "yellow", label: "Ingen position" });
  }
  // Future: credit lock check placeholder
  return flags.slice(0, 3);
}

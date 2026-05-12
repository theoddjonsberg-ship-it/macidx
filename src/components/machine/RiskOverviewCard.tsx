import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { useMachineRiskContext } from "@/hooks/useMachineRiskContext";
import {
  getRiskFlagsExtended,
  getNextStepsForOwner,
  type RiskFlag,
} from "@/lib/risk-flags";

interface RiskOverviewCardProps {
  machineId: string;
  showOwnerTips?: boolean;
}

export function RiskOverviewCard({ machineId, showOwnerTips = false }: RiskOverviewCardProps) {
  const { data: context, isLoading } = useMachineRiskContext(machineId);

  if (isLoading) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-foreground mb-4">Riskbild</h3>
        <div className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      </Card>
    );
  }

  if (!context) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-foreground mb-4">Riskbild</h3>
        <p className="text-sm text-muted-foreground">Kunde inte ladda riskdata</p>
      </Card>
    );
  }

  const flags = getRiskFlagsExtended(context);
  const redFlags = flags.filter((f) => f.severity === "red");
  const yellowFlags = flags.filter((f) => f.severity === "yellow");
  const greenFlags = flags.filter((f) => f.severity === "green");

  const nextSteps = showOwnerTips ? getNextStepsForOwner(flags) : [];

  return (
    <Card>
      <h3 className="text-sm font-semibold text-foreground mb-4">Riskbild</h3>

      {/* Summary counts */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        {redFlags.length > 0 && (
          <span className="flex items-center gap-1 text-destructive">
            <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
            {redFlags.length} kritiska
          </span>
        )}
        {yellowFlags.length > 0 && (
          <span className="flex items-center gap-1 text-warning">
            <Info className="h-4 w-4" strokeWidth={1.75} />
            {yellowFlags.length} varningar
          </span>
        )}
        {greenFlags.length > 0 && (
          <span className="flex items-center gap-1 text-primary">
            <CheckCircle className="h-4 w-4" strokeWidth={1.75} />
            {greenFlags.length} ok
          </span>
        )}
      </div>

      {/* Flag list */}
      <div className="space-y-1.5">
        {redFlags.map((flag) => (
          <RiskFlagRow key={flag.code} flag={flag} />
        ))}
        {yellowFlags.map((flag) => (
          <RiskFlagRow key={flag.code} flag={flag} />
        ))}
        {greenFlags.slice(0, 3).map((flag) => (
          <RiskFlagRow key={flag.code} flag={flag} />
        ))}
        {greenFlags.length > 3 && (
          <p className="text-xs text-muted-foreground pl-5">
            +{greenFlags.length - 3} fler positiva faktorer
          </p>
        )}
      </div>

      {/* Next steps for owners */}
      {showOwnerTips && nextSteps.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Nasta steg
          </h4>
          <ul className="space-y-1.5">
            {nextSteps.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                  {i + 1}
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function RiskFlagRow({ flag }: { flag: RiskFlag }) {
  const Icon =
    flag.severity === "red"
      ? AlertTriangle
      : flag.severity === "yellow"
        ? Info
        : CheckCircle;

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm",
        flag.severity === "red" && "text-destructive",
        flag.severity === "yellow" && "text-warning",
        flag.severity === "green" && "text-primary"
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
      <span>{flag.label}</span>
    </div>
  );
}

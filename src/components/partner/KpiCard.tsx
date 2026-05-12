import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import type { LucideIcon } from "lucide-react";

export interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: "primary" | "trust" | "warning" | "destructive" | "muted";
  mono?: boolean;
}

const accentClasses: Record<string, string> = {
  primary: "text-primary",
  trust: "text-primary",
  warning: "text-warning",
  destructive: "text-destructive",
  muted: "text-muted-foreground",
};

export function KpiCard({ icon: Icon, label, value, accent = "primary", mono = false }: KpiCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-control bg-muted/50", accentClasses[accent])}>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className={cn(
            "text-xl font-semibold tabular-nums mt-0.5",
            accentClasses[accent],
            mono && "font-mono"
          )}>
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}

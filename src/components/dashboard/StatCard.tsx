import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

interface Props {
  label: string;
  value: ReactNode;
  description?: string;
  action?: ReactNode;
}

export function StatCard({ label, value, description, action }: Props) {
  return (
    <Card>
      <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tabular-nums leading-none">
        {value}
      </p>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}

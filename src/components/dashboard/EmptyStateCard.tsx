import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyStateCard({
  icon: Icon,
  title,
  description,
  action,
  className,
}: Props) {
  return (
    <div className={cn("flex flex-col items-center text-center py-8 px-4", className)}>
      {Icon && (
        <div className="h-10 w-10 rounded-coin bg-muted flex items-center justify-center mb-3">
          <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
        </div>
      )}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

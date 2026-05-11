import { Link } from "react-router-dom";
import { Check, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  href: string;
  done?: boolean;
}

export function ActionCard({ icon: Icon, title, description, href, done }: Props) {
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-3 p-3 -mx-3 rounded-control min-h-touch",
        "transition-colors ease-standard duration-base",
        "hover:bg-surface-track"
      )}
    >
      {Icon && (
        <div
          className={cn(
            "h-9 w-9 rounded-coin flex items-center justify-center shrink-0",
            done ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium",
            done ? "text-muted-foreground line-through" : "text-foreground"
          )}
        >
          {title}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {done ? (
        <Check className="h-4 w-4 text-primary shrink-0" strokeWidth={2} aria-hidden="true" />
      ) : (
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.75} aria-hidden="true" />
      )}
    </Link>
  );
}

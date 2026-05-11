import { Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { EmptyStateCard } from "@/components/dashboard/EmptyStateCard";
import { describeEvent } from "@/lib/audit";
import type { AuditLogRow } from "@/types/database";

interface Props {
  events: AuditLogRow[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

function timeAgo(iso: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "nyss";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} tim`;
  const days = Math.round(hours / 24);
  return `${days} d`;
}

export function ActivityFeed({ events, isLoading, isError, onRetry }: Props) {
  if (isLoading) {
    return (
      <ul className="mt-3 space-y-3" aria-busy="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <li key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-coin" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-3 w-10" />
          </li>
        ))}
      </ul>
    );
  }

  if (isError) {
    return (
      <div className="mt-3">
        <FormError>Kunde inte hämta händelser</FormError>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry} className="mt-2">
            Försök igen
          </Button>
        )}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <EmptyStateCard
        icon={Activity}
        title="Inga händelser ännu"
        description="När du eller dina teammedlemmar gör ändringar visas aktiviteten här."
      />
    );
  }

  return (
    <ul className="mt-3 divide-y divide-border">
      {events.map((event) => {
        const { label, icon: Icon } = describeEvent(event.action, event.entity_type);
        return (
          <li key={event.id} className="py-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-coin bg-muted flex items-center justify-center shrink-0">
              <Icon
                className="h-4 w-4 text-muted-foreground"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </div>
            <span className="text-sm text-foreground flex-1 truncate">{label}</span>
            <span className="text-xs text-muted-foreground font-mono shrink-0 tabular-nums">
              {timeAgo(event.occurred_at)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

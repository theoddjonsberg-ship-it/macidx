import {
  CheckCircle,
  Activity,
  Shield,
  Wrench,
  ArrowRightLeft,
  FileText,
  MapPin,
  Clock,
  ClipboardList,
  ShieldOff,
} from "lucide-react";
import {
  useMachineEvents,
  EVENT_TYPE_FILTERS,
  EVENT_TYPE_LABELS,
  formatRelativeTime,
  type MachineEvent,
} from "@/hooks/useMachineEvents";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface MachineEventsProps {
  machineId: string;
}

const EVENT_ICONS: Record<string, typeof CheckCircle> = {
  registration: CheckCircle,
  status_change: Activity,
  verification: Shield,
  service: Wrench,
  ownership_transferred: ArrowRightLeft,
  document_added: FileText,
  document_deleted: FileText,
  consent_granted: Shield,
  consent_revoked: ShieldOff,
  gps_connect: MapPin,
  engine_hours_sync: Clock,
};

const EVENT_COLORS: Record<string, string> = {
  registration: "bg-primary",
  status_change: "bg-primary",
  verification: "bg-primary",
  service: "bg-warning",
  ownership_transferred: "bg-primary",
  document_added: "bg-primary",
  document_deleted: "bg-muted-foreground",
  consent_granted: "bg-primary",
  consent_revoked: "bg-destructive",
  gps_connect: "bg-primary",
  engine_hours_sync: "bg-muted-foreground",
};

export function MachineEvents({ machineId }: MachineEventsProps) {
  const [filter, setFilter] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(25);

  const { data: events, isLoading } = useMachineEvents(machineId, {
    pageSize,
    eventTypeFilter: filter,
  });

  if (isLoading) {
    return (
      <Card>
        <div className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <Card className="p-3">
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPE_FILTERS.map((f) => (
            <button
              key={f.value ?? "all"}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[32px]",
                filter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Timeline */}
      <Card>
        {!events || events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground/40 mb-3" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-foreground mb-1">Inga händelser</p>
            <p className="text-xs text-muted-foreground">
              {filter
                ? "Inga händelser med valt filter. Prova ett annat."
                : "Inga händelser har registrerats för denna maskin."}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border/50" />

            <div className="space-y-0">
              {events.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {events && events.length >= pageSize && (
          <div className="mt-4 pt-4 border-t border-border">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPageSize((p) => p + 25)}
              className="w-full"
            >
              Visa fler
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function EventRow({ event }: { event: MachineEvent }) {
  const Icon = EVENT_ICONS[event.event_type] || ClipboardList;
  const dotColor = EVENT_COLORS[event.event_type] || "bg-muted-foreground";
  const typeLabel = EVENT_TYPE_LABELS[event.event_type] || event.event_type;
  const fullTimestamp = new Date(event.created_at).toLocaleString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex items-start gap-4 py-3 relative">
      <div
        className={cn(
          "h-[15px] w-[15px] rounded-full flex-shrink-0 z-10 ring-2 ring-background",
          dotColor
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <Icon className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" strokeWidth={1.75} />
          <p className="text-sm text-foreground font-medium">{event.title}</p>
          <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {typeLabel}
          </span>
        </div>
        {event.description && (
          <p className="text-xs text-muted-foreground">{event.description}</p>
        )}
        {event.actor_display_name && (
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            Av {event.actor_display_name}
          </p>
        )}
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-xs text-muted-foreground/60 font-mono" title={fullTimestamp}>
          {formatRelativeTime(event.created_at)}
        </p>
      </div>
    </div>
  );
}

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { describeEvent, formatTimestamp } from "@/lib/audit";
import type { AuditLogRow } from "@/types/database";

interface Props {
  event: AuditLogRow;
}

export function AuditRow({ event }: Props) {
  const [open, setOpen] = useState(false);
  const { label, icon: Icon } = describeEvent(event.action, event.entity_type);
  const hasMetadata =
    event.metadata !== null &&
    typeof event.metadata === "object" &&
    Object.keys(event.metadata as object).length > 0;

  return (
    <li className="py-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 text-left rounded-control hover:bg-muted/40 px-2 -mx-2 py-1 transition-colors"
        aria-expanded={open}
      >
        <div className="h-8 w-8 rounded-coin bg-muted flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground truncate">{label}</p>
          <p className="text-xs text-muted-foreground font-mono truncate">
            {event.entity_id}
          </p>
        </div>
        <span className="text-xs text-muted-foreground font-mono shrink-0 tabular-nums hidden sm:inline">
          {formatTimestamp(event.occurred_at)}
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.75} aria-hidden="true" />
        )}
      </button>

      {open && (
        <div className="mt-2 ml-11 space-y-2">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
            <dt className="text-muted-foreground">Tid</dt>
            <dd className="font-mono text-foreground">{formatTimestamp(event.occurred_at)}</dd>
            <dt className="text-muted-foreground">Åtgärd</dt>
            <dd className="font-mono text-foreground">{event.action}</dd>
            <dt className="text-muted-foreground">Objekt</dt>
            <dd className="font-mono text-foreground">{event.entity_type}</dd>
            <dt className="text-muted-foreground">Objekt-ID</dt>
            <dd className="font-mono text-foreground break-all">{event.entity_id}</dd>
            <dt className="text-muted-foreground">Aktör</dt>
            <dd className="font-mono text-foreground break-all">
              {event.actor_user_id ?? "System"}
            </dd>
          </dl>
          {hasMetadata && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Metadata</p>
              <pre className="text-xs font-mono bg-muted/40 rounded-control p-3 overflow-x-auto text-foreground">
{JSON.stringify(event.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

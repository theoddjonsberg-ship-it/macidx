import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { ACTION_OPTIONS, ENTITY_TYPE_OPTIONS } from "@/lib/audit";

export interface AuditFilterState {
  action: string;
  entityType: string;
  from: string;
  to: string;
}

interface Props {
  value: AuditFilterState;
  onChange: (value: AuditFilterState) => void;
}

const selectClass =
  "h-11 w-full rounded-control border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background";
const inputClass =
  "h-11 w-full rounded-control border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background";

export function AuditFilters({ value, onChange }: Props) {
  const hasFilters =
    value.action !== "" || value.entityType !== "" || value.from !== "" || value.to !== "";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div>
        <Label htmlFor="audit-action">Händelse</Label>
        <select
          id="audit-action"
          className={selectClass}
          value={value.action}
          onChange={(e) => onChange({ ...value, action: e.target.value })}
        >
          {ACTION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="audit-entity">Objekt</Label>
        <select
          id="audit-entity"
          className={selectClass}
          value={value.entityType}
          onChange={(e) => onChange({ ...value, entityType: e.target.value })}
        >
          {ENTITY_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="audit-from">Från</Label>
        <input
          id="audit-from"
          type="date"
          className={inputClass}
          value={value.from}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="audit-to">Till</Label>
        <input
          id="audit-to"
          type="date"
          className={inputClass}
          value={value.to}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
        />
      </div>
      {hasFilters && (
        <div className="sm:col-span-2 lg:col-span-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange({ action: "", entityType: "", from: "", to: "" })}
          >
            <X className="h-4 w-4 mr-1" strokeWidth={1.75} aria-hidden="true" />
            Rensa filter
          </Button>
        </div>
      )}
    </div>
  );
}

import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import type { AuditLogRow } from "@/types/database";

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

export function AuditCard() {
  const { data: org } = useActiveOrg();
  const auditQuery = useQuery({
    queryKey: ["audit-recent", org?.id],
    enabled: !!org?.id,
    queryFn: async (): Promise<AuditLogRow[]> => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .eq("org_id", org!.id)
        .order("occurred_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = auditQuery.data ?? [];

  return (
    <Card>
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
          Senaste händelser
        </p>
        <Link to="/audit" className="text-xs text-muted-foreground hover:text-foreground">
          Alla →
        </Link>
      </div>

      {auditQuery.isLoading ? (
        <ul className="mt-3 space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <li key={i}>
              <Skeleton className="h-4 w-full" />
            </li>
          ))}
        </ul>
      ) : auditQuery.isError ? (
        <div className="mt-3">
          <FormError>Kunde inte hämta logg</FormError>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => auditQuery.refetch()}
            className="mt-2"
          >
            Försök igen
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-3">Inga händelser ännu.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id} className="py-2 flex items-baseline justify-between gap-2">
              <span className="text-sm truncate">
                <span className="font-mono text-xs text-muted-foreground mr-1">
                  {r.action}
                </span>
                {r.entity_type}
              </span>
              <span className="text-xs text-muted-foreground font-mono shrink-0">
                {timeAgo(r.occurred_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

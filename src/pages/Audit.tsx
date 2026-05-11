import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { EmptyStateCard } from "@/components/dashboard/EmptyStateCard";
import { AuditFilters, type AuditFilterState } from "@/components/audit/AuditFilters";
import { AuditRow } from "@/components/audit/AuditRow";
import type { AuditLogRow } from "@/types/database";

const PAGE_SIZE = 50;

export function Audit() {
  const { data: org } = useActiveOrg();
  const [filters, setFilters] = useState<AuditFilterState>({
    action: "",
    entityType: "",
    from: "",
    to: "",
  });
  const [limit, setLimit] = useState(PAGE_SIZE);

  const auditQuery = useQuery({
    queryKey: ["audit-log", org?.id, filters, limit],
    enabled: !!org?.id,
    queryFn: async (): Promise<AuditLogRow[]> => {
      let q = supabase
        .from("audit_log")
        .select("*")
        .eq("org_id", org!.id)
        .order("occurred_at", { ascending: false })
        .limit(limit);

      if (filters.action) q = q.eq("action", filters.action);
      if (filters.entityType) q = q.eq("entity_type", filters.entityType);
      if (filters.from) q = q.gte("occurred_at", `${filters.from}T00:00:00`);
      if (filters.to) q = q.lte("occurred_at", `${filters.to}T23:59:59`);

      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const events = auditQuery.data ?? [];
  const canLoadMore = events.length === limit;

  return (
    <AppShell>
      <DashboardHeader
        title="Händelser"
        subtitle="Alla ändringar i organisationen. Logga är skrivskyddad."
      />

      <Card className="mb-4">
        <AuditFilters
          value={filters}
          onChange={(next) => {
            setFilters(next);
            setLimit(PAGE_SIZE);
          }}
        />
      </Card>

      <Card>
        {auditQuery.isLoading ? (
          <ul className="divide-y divide-border" aria-busy="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i} className="py-3 flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-coin" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-3 w-24" />
              </li>
            ))}
          </ul>
        ) : auditQuery.isError ? (
          <div>
            <FormError>Kunde inte hämta händelser</FormError>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => auditQuery.refetch()}
              className="mt-2"
            >
              Försök igen
            </Button>
          </div>
        ) : events.length === 0 ? (
          <EmptyStateCard
            icon={Activity}
            title="Inga händelser matchar"
            description="Justera filtren eller invänta att teamet gör ändringar."
          />
        ) : (
          <>
            <ul className="divide-y divide-border">
              {events.map((event) => (
                <AuditRow key={event.id} event={event} />
              ))}
            </ul>
            {canLoadMore && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setLimit((l) => l + PAGE_SIZE)}
                >
                  Visa fler
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </AppShell>
  );
}

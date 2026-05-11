import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { Card } from "@/components/ui/Card";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import type { AuditLogRow } from "@/types/database";

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

  return (
    <Card className="h-full">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
          Senaste händelser
        </p>
        <Link to="/audit" className="text-xs text-muted-foreground hover:text-foreground">
          Alla →
        </Link>
      </div>
      <ActivityFeed
        events={auditQuery.data ?? []}
        isLoading={auditQuery.isLoading}
        isError={auditQuery.isError}
        onRetry={() => auditQuery.refetch()}
      />
    </Card>
  );
}

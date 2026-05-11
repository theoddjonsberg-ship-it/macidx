import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/dashboard/StatCard";

export function TeamCard() {
  const { data: org } = useActiveOrg();
  const memberQuery = useQuery({
    queryKey: ["team-count", org?.id],
    enabled: !!org?.id,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("organization_members")
        .select("id", { count: "exact", head: true })
        .eq("org_id", org!.id);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const value = memberQuery.isLoading ? (
    <Skeleton className="h-8 w-12" />
  ) : memberQuery.isError ? (
    "—"
  ) : (
    memberQuery.data ?? 0
  );

  return (
    <StatCard
      label="Teammedlemmar"
      value={value}
      description="Personer i din organisation."
      action={
        <Button asChild variant="secondary" size="sm" className="w-full">
          <Link to="/team">Bjud in medlem</Link>
        </Button>
      }
    />
  );
}

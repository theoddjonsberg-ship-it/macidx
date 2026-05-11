import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";

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

  return (
    <Card>
      <p className="font-condensed text-xs tracking-widest uppercase text-muted-foreground">
        Team
      </p>

      {memberQuery.isLoading ? (
        <>
          <Skeleton className="h-7 w-12 mt-2" />
          <Skeleton className="h-4 w-24 mt-2" />
        </>
      ) : memberQuery.isError ? (
        <div className="mt-2">
          <FormError>Kunde inte hämta medlemmar</FormError>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => memberQuery.refetch()}
            className="mt-2"
          >
            Försök igen
          </Button>
        </div>
      ) : (
        <>
          <p className="text-2xl font-semibold mt-1 font-mono">
            {memberQuery.data ?? 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">medlemmar</p>
        </>
      )}

      <Button asChild variant="secondary" size="sm" className="mt-4 w-full">
        <Link to="/team">Bjud in</Link>
      </Button>
    </Card>
  );
}

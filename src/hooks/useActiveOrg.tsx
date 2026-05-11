import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { OrganizationRow } from "@/types/database";

export function useActiveOrg() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["active-org", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<OrganizationRow | null> => {
      if (!user?.id) return null;
      const { data: memberships, error: memberErr } = await supabase
        .from("organization_members")
        .select("org_id, joined_at")
        .eq("user_id", user.id)
        .order("joined_at", { ascending: true })
        .limit(1);
      if (memberErr) throw memberErr;
      const orgId = memberships?.[0]?.org_id;
      if (!orgId) return null;

      const { data: org, error: orgErr } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .maybeSingle();
      if (orgErr) throw orgErr;
      return org;
    },
  });
}

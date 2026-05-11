import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { AppRole } from "@/types/database";

const RANK: Record<AppRole, number> = {
  platform_admin: 5,
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

export function useMyOrgRole(orgId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-org-role", user?.id, orgId],
    enabled: !!user?.id && !!orgId,
    queryFn: async (): Promise<AppRole | null> => {
      if (!user?.id || !orgId) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("org_id", orgId);
      if (error) throw error;
      if (!data || data.length === 0) return null;
      return data.reduce<AppRole>(
        (top, row) => (RANK[row.role] > RANK[top] ? row.role : top),
        data[0].role
      );
    },
  });
}

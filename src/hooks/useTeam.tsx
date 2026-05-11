import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { AppRole } from "@/types/database";

export interface TeamMember {
  membership_id: string;
  user_id: string;
  joined_at: string;
  display_name: string | null;
  avatar_url: string | null;
  role: AppRole | null;
}

export const teamKey = (orgId: string | undefined) => ["team", orgId] as const;

export function useTeam(orgId: string | undefined) {
  return useQuery({
    queryKey: teamKey(orgId),
    enabled: !!orgId,
    queryFn: async (): Promise<TeamMember[]> => {
      if (!orgId) return [];

      const { data: members, error: mErr } = await supabase
        .from("organization_members")
        .select("id, user_id, joined_at")
        .eq("org_id", orgId)
        .order("joined_at", { ascending: true });
      if (mErr) throw mErr;
      if (!members || members.length === 0) return [];

      const userIds = members.map((m) => m.user_id);

      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);
      if (pErr) throw pErr;

      const { data: roles, error: rErr } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("org_id", orgId)
        .in("user_id", userIds);
      if (rErr) throw rErr;

      const rankOrder: Record<AppRole, number> = {
        platform_admin: 5,
        owner: 4,
        admin: 3,
        member: 2,
        viewer: 1,
      };
      const topRoleByUser = new Map<string, AppRole>();
      for (const r of roles ?? []) {
        const current = topRoleByUser.get(r.user_id);
        if (!current || rankOrder[r.role] > rankOrder[current]) {
          topRoleByUser.set(r.user_id, r.role);
        }
      }

      return members.map((m) => {
        const profile = profiles?.find((p) => p.user_id === m.user_id);
        return {
          membership_id: m.id,
          user_id: m.user_id,
          joined_at: m.joined_at,
          display_name: profile?.display_name ?? null,
          avatar_url: profile?.avatar_url ?? null,
          role: topRoleByUser.get(m.user_id) ?? null,
        };
      });
    },
  });
}

export function useInvalidateTeam(orgId: string | undefined) {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: teamKey(orgId) });
}

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { OrganizationRow, AppRole } from "@/types/database";

const STORAGE_KEY = "activeOrgId";

const RANK: Record<AppRole, number> = {
  platform_admin: 5,
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

export interface MyOrg {
  org_id: string;
  org_name: string;
  role: AppRole;
}

export function useActiveOrg() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["active-org", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<OrganizationRow | null> => {
      if (!user?.id) return null;

      // Get all memberships
      const { data: memberships, error: memberErr } = await supabase
        .from("organization_members")
        .select("org_id, joined_at")
        .eq("user_id", user.id)
        .order("joined_at", { ascending: true });
      if (memberErr) throw memberErr;
      if (!memberships || memberships.length === 0) return null;

      // Check localStorage for preferred org
      const storedOrgId = localStorage.getItem(STORAGE_KEY);
      let targetOrgId: string | null = null;

      if (storedOrgId) {
        // Verify user is still a member of stored org
        const isMember = memberships.some((m) => m.org_id === storedOrgId);
        if (isMember) {
          targetOrgId = storedOrgId;
        }
      }

      // Fallback to first org
      if (!targetOrgId) {
        targetOrgId = memberships[0].org_id;
      }

      const { data: org, error: orgErr } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", targetOrgId)
        .maybeSingle();
      if (orgErr) throw orgErr;
      return org;
    },
  });
}

export function useMyOrgs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-orgs", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<MyOrg[]> => {
      if (!user?.id) return [];

      // Get all memberships with org data
      const { data: memberships, error: memberErr } = await supabase
        .from("organization_members")
        .select("org_id, organizations(id, name)")
        .eq("user_id", user.id);
      if (memberErr) throw memberErr;
      if (!memberships || memberships.length === 0) return [];

      // Get all roles for user
      const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("org_id, role")
        .eq("user_id", user.id);
      if (rolesErr) throw rolesErr;

      // Build result with highest role per org
      const result: MyOrg[] = [];
      for (const m of memberships) {
        const org = m.organizations as unknown as { id: string; name: string } | null;
        if (!org) continue;

        // Find highest role for this org
        const orgRoles = (roles ?? []).filter((r) => r.org_id === org.id);
        let highestRole: AppRole = "viewer";
        for (const r of orgRoles) {
          if (RANK[r.role] > RANK[highestRole]) {
            highestRole = r.role;
          }
        }

        result.push({
          org_id: org.id,
          org_name: org.name,
          role: highestRole,
        });
      }

      return result;
    },
  });
}

export function useSetActiveOrg() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useCallback(
    (orgId: string) => {
      localStorage.setItem(STORAGE_KEY, orgId);
      // Invalidate org-related queries
      queryClient.invalidateQueries({ queryKey: ["active-org", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["my-org-role"] });
      queryClient.invalidateQueries({ queryKey: ["team"] });
      queryClient.invalidateQueries({ queryKey: ["audit-log"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread", user?.id] });
    },
    [queryClient, user?.id]
  );
}

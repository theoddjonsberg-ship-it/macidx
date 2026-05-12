import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useActiveOrg } from "@/hooks/useActiveOrg";

export interface OrgConsent {
  id: string;
  viewer_org_id: string;
  viewer_org_name: string;
  viewer_org_type: string | null;
  consent_level: number;
  purpose: string | null;
  granted_at: string;
  expires_at: string | null;
  granted_by_name: string | null;
}

export function useOrgGrantedConsents() {
  const { data: activeOrg } = useActiveOrg();

  return useQuery({
    queryKey: ["org-granted-consents", activeOrg?.id],
    enabled: !!activeOrg?.id,
    queryFn: async (): Promise<OrgConsent[]> => {
      if (!activeOrg?.id) return [];

      // Fetch active consents where this org is the customer
      const { data: consents, error } = await supabase
        .from("data_sharing_consents")
        .select("*")
        .eq("customer_org_id", activeOrg.id)
        .is("revoked_at", null)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order("granted_at", { ascending: false });

      if (error) throw error;

      if (!consents || consents.length === 0) return [];

      // Fetch viewer orgs
      const viewerOrgIds = [...new Set(consents.map((c) => c.viewer_org_id))];
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id, name, org_type")
        .in("id", viewerOrgIds);

      const orgMap = new Map(orgs?.map((o) => [o.id, o]) ?? []);

      // Fetch granter profiles
      const granterIds = [...new Set(consents.map((c) => c.granted_by).filter(Boolean))] as string[];
      let granterMap = new Map<string, string | null>();
      if (granterIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", granterIds);
        if (profiles) {
          profiles.forEach((p) => granterMap.set(p.user_id, p.display_name));
        }
      }

      return consents.map((c) => {
        const org = orgMap.get(c.viewer_org_id);
        return {
          id: c.id,
          viewer_org_id: c.viewer_org_id,
          viewer_org_name: org?.name ?? "Okänt bolag",
          viewer_org_type: org?.org_type ?? null,
          consent_level: c.consent_level,
          purpose: c.purpose,
          granted_at: c.granted_at,
          expires_at: c.expires_at,
          granted_by_name: c.granted_by ? granterMap.get(c.granted_by) ?? null : null,
        };
      });
    },
  });
}

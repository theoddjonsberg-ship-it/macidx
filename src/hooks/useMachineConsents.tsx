import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export interface ConsentRow {
  id: string;
  customer_org_id: string;
  viewer_org_id: string;
  viewer_type: string;
  consent_level: number;
  purpose: string | null;
  granted_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  granted_by: string | null;
  // Joined
  viewer_org?: {
    name: string;
    org_type: string | null;
  } | null;
  granted_by_profile?: {
    display_name: string | null;
  } | null;
}

export function useMachineConsents(orgId: string | undefined) {
  return useQuery({
    queryKey: ["machine-consents", orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<ConsentRow[]> => {
      const { data, error } = await supabase
        .from("data_sharing_consents")
        .select("*")
        .eq("customer_org_id", orgId!)
        .is("revoked_at", null)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order("granted_at", { ascending: false });
      if (error) throw error;

      const consents = data ?? [];

      // Fetch viewer orgs
      const viewerOrgIds = [...new Set(consents.map((c) => c.viewer_org_id))];
      let viewerOrgMap = new Map<string, { name: string; org_type: string | null }>();
      if (viewerOrgIds.length > 0) {
        const { data: orgs } = await supabase
          .from("organizations")
          .select("id, name, org_type")
          .in("id", viewerOrgIds);
        if (orgs) {
          orgs.forEach((o) => viewerOrgMap.set(o.id, { name: o.name, org_type: o.org_type }));
        }
      }

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

      return consents.map((row) => ({
        id: row.id,
        customer_org_id: row.customer_org_id,
        viewer_org_id: row.viewer_org_id,
        viewer_type: row.viewer_type,
        consent_level: row.consent_level,
        purpose: row.purpose,
        granted_at: row.granted_at,
        expires_at: row.expires_at,
        revoked_at: row.revoked_at,
        granted_by: row.granted_by,
        viewer_org: viewerOrgMap.get(row.viewer_org_id) ?? null,
        granted_by_profile: row.granted_by
          ? { display_name: granterMap.get(row.granted_by) ?? null }
          : null,
      }));
    },
  });
}

interface RevokeConsentInput {
  consentId: string;
  machineId?: string;
}

export function useRevokeConsent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ consentId, machineId }: RevokeConsentInput) => {
      const { error } = await supabase
        .from("data_sharing_consents")
        .update({
          revoked_at: new Date().toISOString(),
          revoked_by: user?.id,
        })
        .eq("id", consentId);
      if (error) throw error;

      // Log event if machine context
      if (machineId && user?.id) {
        await supabase.from("machine_events").insert({
          machine_id: machineId,
          actor_user_id: user.id,
          event_type: "consent_revoked",
          title: "Samtycke återkallat",
          description: "Ett datadelningssamtycke återkallades.",
          metadata: { consent_id: consentId },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machine-consents"] });
      queryClient.invalidateQueries({ queryKey: ["machine-events"] });
      toast.success("Samtycke aterkallat");
    },
    onError: () => {
      toast.error("Kunde inte aterkalla samtycke");
    },
  });
}

export const VIEWER_TYPE_LABELS: Record<string, string> = {
  insurance: "Försäkring",
  finance: "Finans",
  leasing: "Leasing",
  broker: "Mäklare",
  bank: "Bank",
  service_partner: "Servicepartner",
};

export const CONSENT_LEVEL_LABELS: Record<number, string> = {
  1: "Aggregerat",
  2: "Anonymiserat",
  3: "Full insyn",
};

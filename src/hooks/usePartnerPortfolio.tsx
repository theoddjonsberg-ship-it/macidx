import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import type { MiiLevel } from "@/types/database";

export interface PortfolioMachine {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  type: string | null;
  mii_level: MiiLevel;
  trust_score: number;
  trust_breakdown: Record<string, unknown> | null;
  status: string;
  year: number | null;
  operating_hours: number;
  org_id: string;
  latitude: number | null;
  longitude: number | null;
  last_gps_update: string | null;
  estimated_residual_value: number | null;
  organization: {
    id: string;
    name: string;
    org_number: string | null;
    contact_person: string | null;
  } | null;
  consent: {
    consent_level: number;
    expires_at: string | null;
    granted_at: string;
  } | null;
}

export function usePartnerPortfolio() {
  const { data: activeOrg } = useActiveOrg();
  const queryClient = useQueryClient();

  // Realtime subscription for consent changes
  useEffect(() => {
    if (!activeOrg?.id) return;

    const channel = supabase
      .channel(`partner-consents-${activeOrg.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "data_sharing_consents",
          filter: `viewer_org_id=eq.${activeOrg.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["partner-portfolio", activeOrg.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrg?.id, queryClient]);

  return useQuery({
    queryKey: ["partner-portfolio", activeOrg?.id],
    enabled: !!activeOrg?.id,
    queryFn: async (): Promise<PortfolioMachine[]> => {
      if (!activeOrg?.id) return [];

      // 1. Fetch active consents where current org is viewer
      const { data: consents, error: consentErr } = await supabase
        .from("data_sharing_consents")
        .select("customer_org_id, consent_level, expires_at, granted_at")
        .eq("viewer_org_id", activeOrg.id)
        .is("revoked_at", null);

      if (consentErr) throw consentErr;

      const customerIds = [...new Set((consents ?? []).map((c) => c.customer_org_id))];
      if (customerIds.length === 0) return [];

      // 2. Fetch all machines for these customer orgs
      const { data: machines, error: machErr } = await supabase
        .from("machines")
        .select("*")
        .in("org_id", customerIds);

      if (machErr) throw machErr;

      // 3. Fetch organization data separately
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id, name, org_number, contact_person")
        .in("id", customerIds);

      const orgMap = new Map(orgs?.map((o) => [o.id, o]) ?? []);

      // 4. Map machines with organization and consent data
      return (machines ?? []).map((m) => ({
        id: m.id,
        name: m.name,
        brand: m.brand,
        model: m.model,
        serial_number: m.serial_number,
        type: m.type,
        mii_level: m.mii_level as MiiLevel,
        trust_score: m.trust_score ?? 0,
        trust_breakdown: m.trust_breakdown as Record<string, unknown> | null,
        status: m.status,
        year: m.year,
        operating_hours: m.operating_hours ?? 0,
        org_id: m.org_id,
        latitude: m.latitude,
        longitude: m.longitude,
        last_gps_update: m.last_gps_update,
        estimated_residual_value: m.estimated_residual_value ?? null,
        organization: orgMap.get(m.org_id) ?? null,
        consent: consents?.find((c) => c.customer_org_id === m.org_id) ?? null,
      }));
    },
  });
}

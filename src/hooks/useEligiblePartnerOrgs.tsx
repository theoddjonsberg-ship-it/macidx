import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useActiveOrg } from "@/hooks/useActiveOrg";

export interface PartnerOrg {
  id: string;
  name: string;
  org_type: string;
  org_number: string | null;
}

const PARTNER_ORG_TYPES = [
  "insurance",
  "finance",
  "leasing",
  "service_partner",
  "dealer",
  "oem",
];

export function useEligiblePartnerOrgs() {
  const { data: activeOrg } = useActiveOrg();

  return useQuery({
    queryKey: ["eligible-partner-orgs", activeOrg?.id],
    enabled: !!activeOrg?.id,
    queryFn: async (): Promise<PartnerOrg[]> => {
      if (!activeOrg?.id) return [];

      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, org_type, org_number")
        .in("org_type", PARTNER_ORG_TYPES)
        .neq("id", activeOrg.id)
        .order("name");

      if (error) throw error;

      return (data ?? []).map((org) => ({
        id: org.id,
        name: org.name,
        org_type: org.org_type ?? "unknown",
        org_number: org.org_number,
      }));
    },
  });
}

export const ORG_TYPE_LABELS: Record<string, string> = {
  insurance: "Försäkring",
  finance: "Finans",
  leasing: "Leasing",
  service_partner: "Servicepartner",
  dealer: "Återförsäljare",
  oem: "Tillverkare",
  machine_owner: "Maskinägare",
};

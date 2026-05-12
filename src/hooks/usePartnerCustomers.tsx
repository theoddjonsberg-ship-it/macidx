import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { usePartnerPortfolio } from "@/hooks/usePartnerPortfolio";

export interface PartnerCustomer {
  org_id: string;
  org_name: string;
  org_number: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  machine_count: number;
  avg_trust_score: number;
  consent_levels: number[];
  earliest_expiry: string | null;
  total_residual_value: number;
}

export function usePartnerCustomers() {
  const { data: activeOrg } = useActiveOrg();
  const { data: portfolio, isLoading: portfolioLoading } = usePartnerPortfolio();

  return useQuery({
    queryKey: ["partner-customers", activeOrg?.id],
    enabled: !!activeOrg?.id && !portfolioLoading && !!portfolio,
    queryFn: async (): Promise<PartnerCustomer[]> => {
      if (!portfolio) return [];

      // Group portfolio by customer org
      const byOrg = new Map<string, PartnerCustomer>();

      for (const m of portfolio) {
        const org = m.organization;
        if (!org) continue;

        if (!byOrg.has(org.id)) {
          byOrg.set(org.id, {
            org_id: org.id,
            org_name: org.name,
            org_number: org.org_number,
            contact_person: org.contact_person,
            contact_email: null,
            contact_phone: null,
            machine_count: 0,
            avg_trust_score: 0,
            consent_levels: [],
            earliest_expiry: null,
            total_residual_value: 0,
          });
        }

        const c = byOrg.get(org.id)!;
        c.machine_count++;
        c.avg_trust_score += m.trust_score ?? 0;
        c.total_residual_value += m.estimated_residual_value ?? 350000;

        if (m.consent?.consent_level && !c.consent_levels.includes(m.consent.consent_level)) {
          c.consent_levels.push(m.consent.consent_level);
        }

        if (m.consent?.expires_at) {
          if (!c.earliest_expiry || m.consent.expires_at < c.earliest_expiry) {
            c.earliest_expiry = m.consent.expires_at;
          }
        }
      }

      // Calculate averages
      const customers = Array.from(byOrg.values()).map((c) => ({
        ...c,
        avg_trust_score: c.machine_count > 0 ? Math.round(c.avg_trust_score / c.machine_count) : 0,
      }));

      // Fetch contact email + phone separately
      const orgIds = customers.map((c) => c.org_id);
      if (orgIds.length > 0) {
        const { data: orgs } = await supabase
          .from("organizations")
          .select("id, contact_email, contact_phone")
          .in("id", orgIds);

        orgs?.forEach((o) => {
          const c = customers.find((cust) => cust.org_id === o.id);
          if (c) {
            c.contact_email = o.contact_email;
            c.contact_phone = o.contact_phone;
          }
        });
      }

      return customers.sort((a, b) => b.machine_count - a.machine_count);
    },
  });
}

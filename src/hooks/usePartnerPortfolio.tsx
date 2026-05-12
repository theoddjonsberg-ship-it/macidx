import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import type { MiiLevel, TrustBreakdown } from "@/types/database";

export interface PortfolioMachine {
  id: string;
  org_id: string;
  name: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  year: number | null;
  type: string | null;
  status: string;
  mii_level: MiiLevel;
  trust_score: number;
  trust_breakdown: TrustBreakdown | null;
  operating_hours: number;
  latitude: number | null;
  longitude: number | null;
  last_gps_update: string | null;
  created_at: string;
  organization: {
    id: string;
    name: string;
    org_number: string | null;
    contact_person: string | null;
  } | null;
  consent: {
    customer_org_id: string;
    consent_level: number;
    expires_at: string | null;
    granted_at: string;
  } | null;
}

export interface PortfolioStats {
  total: number;
  avgTrust: number;
  lowTrustCount: number;
  expiringCount: number;
  byMiiLevel: Record<MiiLevel, number>;
}

export function usePartnerPortfolio() {
  const { data: activeOrg } = useActiveOrg();

  return useQuery({
    queryKey: ["partner-portfolio", activeOrg?.id],
    enabled: !!activeOrg?.id,
    queryFn: async (): Promise<PortfolioMachine[]> => {
      if (!activeOrg?.id) return [];

      // 1. Hämta aktiva consents där aktiv org är viewer
      const { data: consents, error: consentErr } = await supabase
        .from("data_sharing_consents")
        .select("customer_org_id, consent_level, expires_at, granted_at")
        .eq("viewer_org_id", activeOrg.id)
        .is("revoked_at", null);

      if (consentErr) throw consentErr;

      const customerIds = [...new Set((consents ?? []).map((c) => c.customer_org_id))];
      if (customerIds.length === 0) return [];

      // 2. Hämta alla maskiner för dessa customer-orgs
      const { data: machines, error: machErr } = await supabase
        .from("machines")
        .select("*")
        .in("org_id", customerIds);

      if (machErr) throw machErr;

      // 3. Hämta organization data separat
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id, name, org_number, contact_person")
        .in("id", customerIds);

      const orgMap = new Map(orgs?.map((o) => [o.id, o]) ?? []);

      return (machines ?? []).map((m) => ({
        id: m.id,
        org_id: m.org_id,
        name: m.name,
        brand: m.brand,
        model: m.model,
        serial_number: m.serial_number,
        year: m.year,
        type: m.type,
        status: m.status,
        mii_level: m.mii_level as MiiLevel,
        trust_score: m.trust_score ?? 0,
        trust_breakdown: m.trust_breakdown as TrustBreakdown | null,
        operating_hours: m.operating_hours ?? 0,
        latitude: m.latitude,
        longitude: m.longitude,
        last_gps_update: m.last_gps_update,
        created_at: m.created_at,
        organization: orgMap.get(m.org_id) ?? null,
        consent: consents?.find((c) => c.customer_org_id === m.org_id) ?? null,
      }));
    },
  });
}

export function usePortfolioStats(portfolio: PortfolioMachine[] | undefined): PortfolioStats {
  const total = portfolio?.length ?? 0;
  const avgTrust =
    total > 0 ? Math.round(portfolio!.reduce((sum, m) => sum + (m.trust_score ?? 0), 0) / total) : 0;
  const lowTrustCount = portfolio?.filter((m) => (m.trust_score ?? 0) < 50).length ?? 0;

  // Count consents expiring in 30 days
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const expiringCount =
    portfolio?.filter((m) => {
      if (!m.consent?.expires_at) return false;
      const expiry = new Date(m.consent.expires_at).getTime();
      return expiry > now && expiry < now + thirtyDays;
    }).length ?? 0;

  // Count by MII level
  const byMiiLevel: Record<MiiLevel, number> = { L0: 0, L1: 0, L2: 0, L3: 0, L4: 0 };
  portfolio?.forEach((m) => {
    byMiiLevel[m.mii_level] = (byMiiLevel[m.mii_level] ?? 0) + 1;
  });

  return { total, avgTrust, lowTrustCount, expiringCount, byMiiLevel };
}

export function groupByCustomer(
  portfolio: PortfolioMachine[]
): Record<string, { org: PortfolioMachine["organization"]; machines: PortfolioMachine[] }> {
  return portfolio.reduce(
    (acc, m) => {
      const orgId = m.org_id;
      if (!acc[orgId]) {
        acc[orgId] = { org: m.organization, machines: [] };
      }
      acc[orgId].machines.push(m);
      return acc;
    },
    {} as Record<string, { org: PortfolioMachine["organization"]; machines: PortfolioMachine[] }>
  );
}

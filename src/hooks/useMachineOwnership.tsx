import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface OwnershipHistoryRow {
  id: string;
  machine_id: string;
  org_id: string;
  from_date: string;
  to_date: string | null;
  transfer_method: string | null;
  created_at: string;
  // Joined
  organization?: {
    name: string;
    org_number: string | null;
    contact_person: string | null;
  } | null;
}

export interface CurrentOwner {
  org_id: string;
  org_name: string;
  org_number: string | null;
  contact_person: string | null;
  owner_since: string | null;
}

export function useCurrentOwner(machineId: string | undefined, orgId: string | undefined) {
  return useQuery({
    queryKey: ["current-owner", machineId, orgId],
    enabled: !!machineId && !!orgId,
    queryFn: async (): Promise<CurrentOwner | null> => {
      // Get organization details
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("id, name, org_number, contact_person")
        .eq("id", orgId!)
        .maybeSingle();
      if (orgError) throw orgError;
      if (!org) return null;

      // Get ownership start date from ownership_history
      const { data: history } = await supabase
        .from("ownership_history")
        .select("from_date")
        .eq("machine_id", machineId!)
        .eq("org_id", orgId!)
        .is("to_date", null)
        .order("from_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        org_id: org.id,
        org_name: org.name,
        org_number: org.org_number,
        contact_person: org.contact_person,
        owner_since: history?.from_date ?? null,
      };
    },
  });
}

export function useOwnershipHistory(machineId: string | undefined) {
  return useQuery({
    queryKey: ["ownership-history", machineId],
    enabled: !!machineId,
    queryFn: async (): Promise<OwnershipHistoryRow[]> => {
      const { data, error } = await supabase
        .from("ownership_history")
        .select("*")
        .eq("machine_id", machineId!)
        .order("from_date", { ascending: false });
      if (error) throw error;

      const history = data ?? [];

      // Fetch organization details
      const orgIds = [...new Set(history.map((h) => h.org_id))];
      let orgMap = new Map<string, { name: string; org_number: string | null; contact_person: string | null }>();
      if (orgIds.length > 0) {
        const { data: orgs } = await supabase
          .from("organizations")
          .select("id, name, org_number, contact_person")
          .in("id", orgIds);
        if (orgs) {
          orgs.forEach((o) =>
            orgMap.set(o.id, { name: o.name, org_number: o.org_number, contact_person: o.contact_person })
          );
        }
      }

      return history.map((row) => ({
        id: row.id,
        machine_id: row.machine_id,
        org_id: row.org_id,
        from_date: row.from_date,
        to_date: row.to_date,
        transfer_method: row.transfer_method,
        created_at: row.created_at,
        organization: orgMap.get(row.org_id) ?? null,
      }));
    },
  });
}

export const TRANSFER_METHOD_LABELS: Record<string, string> = {
  freja: "Freja eID",
  bankid: "BankID",
  manual: "Manuell",
  verifiero: "Verifiero",
};

export function formatDuration(fromDate: string, toDate: string | null): string {
  const start = new Date(fromDate).getTime();
  const end = toDate ? new Date(toDate).getTime() : Date.now();
  const days = Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));

  if (days < 31) return `${days} dagar`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} mån`;
  const years = (days / 365).toFixed(1);
  return `${years} år`;
}

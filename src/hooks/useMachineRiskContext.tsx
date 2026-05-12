import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { RiskFlagContext } from "@/lib/risk-flags";

interface UseMachineRiskContextResult {
  data: RiskFlagContext | null;
  isLoading: boolean;
  error: Error | null;
}

export function useMachineRiskContext(machineId: string | undefined): UseMachineRiskContextResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ["machine-risk-context", machineId],
    enabled: !!machineId,
    queryFn: async (): Promise<RiskFlagContext | null> => {
      if (!machineId) return null;

      // Fetch machine base data
      const { data: machine, error: machineError } = await supabase
        .from("machines")
        .select("mii_level, trust_score, latitude, year, operating_hours")
        .eq("id", machineId)
        .single();
      if (machineError) throw machineError;
      if (!machine) return null;

      // Fetch document count and types
      const { data: documents, error: docError } = await supabase
        .from("documents")
        .select("document_type")
        .eq("machine_id", machineId)
        .is("deleted_at", null);
      if (docError) throw docError;

      const docTypes = (documents ?? []).map((d) => d.document_type);
      const document_count = docTypes.length;
      const has_insurance_doc = docTypes.includes("insurance");
      const has_purchase_agreement = docTypes.includes("purchase_agreement");

      // Fetch event count
      const { count: event_count, error: eventError } = await supabase
        .from("machine_events")
        .select("id", { count: "exact", head: true })
        .eq("machine_id", machineId);
      if (eventError) throw eventError;

      // Find last service event
      const { data: lastService } = await supabase
        .from("machine_events")
        .select("created_at")
        .eq("machine_id", machineId)
        .eq("event_type", "service")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let last_service_days_ago: number | null = null;
      if (lastService?.created_at) {
        const serviceDate = new Date(lastService.created_at).getTime();
        const now = Date.now();
        last_service_days_ago = Math.floor((now - serviceDate) / (1000 * 60 * 60 * 24));
      }

      // Fetch ownership transfers in last 24 months
      const twentyFourMonthsAgo = new Date();
      twentyFourMonthsAgo.setMonth(twentyFourMonthsAgo.getMonth() - 24);

      const { count: ownership_transfer_count_24mo, error: ownershipError } = await supabase
        .from("ownership_history")
        .select("id", { count: "exact", head: true })
        .eq("machine_id", machineId)
        .gte("from_date", twentyFourMonthsAgo.toISOString());
      if (ownershipError) throw ownershipError;

      // Check for active credit lock (if we have such a table - assume false for now)
      // This would need to be implemented when credit lock feature is added
      const has_active_credit_lock = false;

      return {
        mii_level: machine.mii_level,
        trust_score: machine.trust_score,
        latitude: machine.latitude,
        year: machine.year,
        operating_hours: machine.operating_hours,
        document_count,
        event_count: event_count ?? 0,
        ownership_transfer_count_24mo: Math.max(0, (ownership_transfer_count_24mo ?? 0) - 1), // Subtract 1 because initial ownership is not a transfer
        has_active_credit_lock,
        has_insurance_doc,
        has_purchase_agreement,
        last_service_days_ago,
      };
    },
  });

  return {
    data: data ?? null,
    isLoading,
    error: error as Error | null,
  };
}

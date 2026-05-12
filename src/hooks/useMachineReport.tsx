import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useMachine } from "@/hooks/useMachines";
import { useMachineDocuments, type DocumentRow } from "@/hooks/useMachineDocuments";
import { useMachineEvents, type MachineEvent } from "@/hooks/useMachineEvents";
import { useOwnershipHistory, type OwnershipHistoryRow } from "@/hooks/useMachineOwnership";
import { useMachineRiskContext } from "@/hooks/useMachineRiskContext";
import { getRiskFlagsExtended, type RiskFlag, type RiskFlagContext } from "@/lib/risk-flags";
import type { NormalizedMachine } from "@/types/machine";

export interface MachineReportData {
  machine: NormalizedMachine;
  documents: DocumentRow[];
  events: MachineEvent[];
  ownershipHistory: OwnershipHistoryRow[];
  riskContext: RiskFlagContext | null;
  riskFlags: RiskFlag[];
  currentOwner: {
    org_name: string;
    org_number: string | null;
    owner_since: string | null;
  } | null;
}

export function useMachineReport(machineId: string | undefined) {
  const { data: machine, isLoading: machineLoading } = useMachine(machineId);
  const { data: documents, isLoading: docsLoading } = useMachineDocuments(machineId);
  const { data: events, isLoading: eventsLoading } = useMachineEvents(machineId, { pageSize: 20 });
  const { data: ownershipHistory, isLoading: ownershipLoading } = useOwnershipHistory(machineId);
  const { data: riskContext, isLoading: riskLoading } = useMachineRiskContext(machineId);

  // Fetch current owner org details
  const currentOwnerQuery = useQuery({
    queryKey: ["machine-current-owner", machineId, machine?.orgId],
    enabled: !!machineId && !!machine?.orgId,
    queryFn: async () => {
      if (!machine?.orgId) return null;

      const { data: org, error } = await supabase
        .from("organizations")
        .select("name, org_number")
        .eq("id", machine.orgId)
        .single();
      if (error) return null;

      // Find ownership start date
      const currentOwnership = ownershipHistory?.find(
        (o) => o.org_id === machine.orgId && o.to_date === null
      );

      return {
        org_name: org.name,
        org_number: org.org_number,
        owner_since: currentOwnership?.from_date ?? null,
      };
    },
  });

  const isLoading =
    machineLoading ||
    docsLoading ||
    eventsLoading ||
    ownershipLoading ||
    riskLoading ||
    currentOwnerQuery.isLoading;

  const riskFlags = riskContext ? getRiskFlagsExtended(riskContext) : [];

  const data: MachineReportData | null =
    machine && !isLoading
      ? {
          machine,
          documents: documents ?? [],
          events: events ?? [],
          ownershipHistory: ownershipHistory ?? [],
          riskContext,
          riskFlags,
          currentOwner: currentOwnerQuery.data ?? null,
        }
      : null;

  return {
    data,
    isLoading,
  };
}

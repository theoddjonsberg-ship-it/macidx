import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { useAuth } from "@/hooks/useAuth";
import type { MachineRow, NormalizedMachine } from "@/types/machine";
import { normalizeMachine } from "@/types/machine";

export function useMachines() {
  const { data: activeOrg } = useActiveOrg();

  return useQuery({
    queryKey: ["machines", activeOrg?.id],
    enabled: !!activeOrg?.id,
    queryFn: async (): Promise<NormalizedMachine[]> => {
      const { data, error } = await supabase
        .from("machines")
        .select("*")
        .eq("org_id", activeOrg!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as MachineRow[]).map(normalizeMachine);
    },
  });
}

export function useMachine(id: string | undefined) {
  return useQuery({
    queryKey: ["machine", id],
    enabled: !!id,
    queryFn: async (): Promise<NormalizedMachine | null> => {
      const { data, error } = await supabase
        .from("machines")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return normalizeMachine(data as MachineRow);
    },
  });
}

export interface CreateMachineInput {
  name: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  year?: number;
  type?: string;
  operating_hours?: number;
}

export function useCreateMachine() {
  const queryClient = useQueryClient();
  const { data: activeOrg } = useActiveOrg();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateMachineInput) => {
      if (!activeOrg?.id) throw new Error("Ingen organisation vald");
      if (!user?.id) throw new Error("Inte inloggad");

      const { data, error } = await supabase
        .from("machines")
        .insert({
          org_id: activeOrg.id,
          owner_user_id: user.id,
          name: input.name,
          brand: input.brand || null,
          model: input.model || null,
          serial_number: input.serial_number || null,
          year: input.year || null,
          type: input.type || null,
          operating_hours: input.operating_hours || 0,
          status: "active",
          mii_level: "L0",
          trust_score: 0,
          verification_level: 0,
        })
        .select("id")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machines"] });
    },
  });
}

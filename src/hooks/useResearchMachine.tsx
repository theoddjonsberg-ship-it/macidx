import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface MachineResearchResult {
  category: string | null;
  subcategory: string | null;
  weight_kg: number | null;
  engine_power_kw: number | null;
  fuel_type: "diesel" | "petrol" | "electric" | "hybrid" | "lpg" | null;
  engine_manufacturer: string | null;
  engine_model: string | null;
  bucket_capacity_m3: number | null;
  max_reach_m: number | null;
  max_lift_capacity_kg: number | null;
  track_or_wheel: "track" | "wheel" | "both" | null;
  typical_applications: string[];
  production_years: { from: number | null; to: number | null };
  successor_model: string | null;
  predecessor_model: string | null;
  notes: string | null;
  confidence: number;
}

interface ResearchInput {
  manufacturer: string;
  model: string;
  year?: number | null;
}

export function useResearchMachine() {
  return useMutation({
    mutationFn: async ({ manufacturer, model, year }: ResearchInput): Promise<MachineResearchResult> => {
      const { data, error } = await supabase.functions.invoke("research-machine", {
        body: { manufacturer, model, year },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data as MachineResearchResult;
    },
  });
}

// Map API category to form category value
export function mapCategoryToFormValue(category: string | null): string {
  const mapping: Record<string, string> = {
    excavator: "excavator",
    wheel_loader: "wheel_loader",
    bulldozer: "bulldozer",
    dumper: "dumper",
    crane: "crane",
    forklift: "forklift",
    tractor: "tractor",
    telehandler: "telehandler",
    compactor: "compactor",
    generator: "generator",
    aerial_platform: "aerial_platform",
    skid_steer: "skid_steer",
    mini_excavator: "mini_excavator",
    backhoe: "backhoe",
  };
  return category ? mapping[category] || "" : "";
}

// Map fuel type to form value
export function mapFuelTypeToFormValue(fuelType: string | null): string {
  const mapping: Record<string, string> = {
    diesel: "diesel",
    petrol: "petrol",
    electric: "electric",
    hybrid: "hybrid",
    lpg: "lpg",
  };
  return fuelType ? mapping[fuelType] || "" : "";
}

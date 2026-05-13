import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface ScanNameplateResult {
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  year: number | null;
  operating_hours: number | null;
  notes: string | null;
  confidence: {
    manufacturer: number;
    model: number;
    serial_number: number;
    year: number;
    operating_hours: number;
  };
}

export function useScanNameplate() {
  return useMutation({
    mutationFn: async (file: File): Promise<ScanNameplateResult> => {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("scan-nameplate", {
        body: { image_base64: base64 },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data as ScanNameplateResult;
    },
  });
}

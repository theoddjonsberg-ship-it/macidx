import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { useAuth } from "@/hooks/useAuth";

export interface GrantConsentInput {
  viewer_org_id: string;
  viewer_type: string;
  consent_level: 1 | 2 | 3;
  purpose: string | null;
  expires_at: string | null;
}

export function useGrantConsent() {
  const queryClient = useQueryClient();
  const { data: activeOrg } = useActiveOrg();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: GrantConsentInput) => {
      if (!activeOrg?.id || !user?.id) throw new Error("Not authenticated");

      const { data: consent, error } = await supabase
        .from("data_sharing_consents")
        .insert({
          customer_org_id: activeOrg.id,
          viewer_org_id: input.viewer_org_id,
          viewer_type: input.viewer_type,
          consent_level: input.consent_level,
          purpose: input.purpose,
          expires_at: input.expires_at,
          granted_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      return consent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machine-consents"] });
      queryClient.invalidateQueries({ queryKey: ["org-granted-consents"] });
      queryClient.invalidateQueries({ queryKey: ["partner-portfolio"] });
    },
  });
}

export function calculateExpiresAt(duration: "30d" | "90d" | "1y" | "indefinite"): string | null {
  if (duration === "indefinite") return null;

  const now = new Date();
  switch (duration) {
    case "30d":
      now.setDate(now.getDate() + 30);
      break;
    case "90d":
      now.setDate(now.getDate() + 90);
      break;
    case "1y":
      now.setFullYear(now.getFullYear() + 1);
      break;
  }
  return now.toISOString();
}

export const CONSENT_LEVEL_OPTIONS = [
  {
    level: 1 as const,
    label: "Översikt",
    description: "Räknat data, ingen specifik maskindata. För portföljanalys.",
    icon: "BarChart3",
  },
  {
    level: 2 as const,
    label: "Anonymiserad",
    description: "Maskinklass, MII-nivå, trust score — men inga serienummer eller dokument. För riskbedömning.",
    icon: "EyeOff",
  },
  {
    level: 3 as const,
    label: "Full insyn",
    description: "Alla maskinuppgifter inklusive dokument och GPS. För finansiering, försäkring, ägarbyte.",
    icon: "Eye",
    warning: "Detta ger partnern tillgång till alla dokument och positionsdata. Du kan återkalla när som helst.",
  },
];

export const DURATION_OPTIONS = [
  { value: "30d" as const, label: "30 dagar" },
  { value: "90d" as const, label: "90 dagar" },
  { value: "1y" as const, label: "1 år" },
  { value: "indefinite" as const, label: "Tills vidare" },
];

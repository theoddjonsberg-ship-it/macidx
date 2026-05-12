import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { useAuth } from "@/hooks/useAuth";
import type { Json } from "@/types/database";

export interface QuoteDraft {
  id: string;
  partner_org_id: string;
  customer_org_id: string;
  machine_ids: string[];
  analysis_text: string | null;
  recommendation: "approved" | "conditional" | "rejected" | null;
  risk_snapshot: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  exported_at: string | null;
  // Joined
  customer_org?: {
    name: string;
    org_number: string | null;
  } | null;
  creator?: {
    display_name: string | null;
  } | null;
}

export function useQuoteDrafts() {
  const { data: activeOrg } = useActiveOrg();

  return useQuery({
    queryKey: ["quote-drafts", activeOrg?.id],
    enabled: !!activeOrg?.id,
    queryFn: async (): Promise<QuoteDraft[]> => {
      if (!activeOrg?.id) return [];

      const { data, error } = await supabase
        .from("quote_drafts")
        .select("*")
        .eq("partner_org_id", activeOrg.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const drafts = data ?? [];

      // Fetch customer org names
      const customerIds = [...new Set(drafts.map((d) => d.customer_org_id))];
      let customerMap = new Map<string, { name: string; org_number: string | null }>();
      if (customerIds.length > 0) {
        const { data: orgs } = await supabase
          .from("organizations")
          .select("id, name, org_number")
          .in("id", customerIds);
        orgs?.forEach((o) => customerMap.set(o.id, { name: o.name, org_number: o.org_number }));
      }

      // Fetch creator profiles
      const creatorIds = [...new Set(drafts.map((d) => d.created_by).filter(Boolean))] as string[];
      let creatorMap = new Map<string, string | null>();
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", creatorIds);
        profiles?.forEach((p) => creatorMap.set(p.user_id, p.display_name));
      }

      return drafts.map((d) => ({
        id: d.id,
        partner_org_id: d.partner_org_id,
        customer_org_id: d.customer_org_id,
        machine_ids: d.machine_ids ?? [],
        analysis_text: d.analysis_text,
        recommendation: d.recommendation as QuoteDraft["recommendation"],
        risk_snapshot: (d.risk_snapshot as Record<string, unknown>) ?? {},
        created_by: d.created_by,
        created_at: d.created_at,
        updated_at: d.updated_at,
        exported_at: d.exported_at,
        customer_org: customerMap.get(d.customer_org_id) ?? null,
        creator: d.created_by
          ? { display_name: creatorMap.get(d.created_by) ?? null }
          : null,
      }));
    },
  });
}

export function useQuoteDraft(id: string | undefined) {
  const { data: activeOrg } = useActiveOrg();

  return useQuery({
    queryKey: ["quote-draft", id],
    enabled: !!activeOrg?.id && !!id,
    queryFn: async (): Promise<QuoteDraft | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("quote_drafts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }

      // Fetch customer org
      const { data: customerOrg } = await supabase
        .from("organizations")
        .select("name, org_number")
        .eq("id", data.customer_org_id)
        .single();

      // Fetch creator
      let creatorName: string | null = null;
      if (data.created_by) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", data.created_by)
          .single();
        creatorName = profile?.display_name ?? null;
      }

      return {
        id: data.id,
        partner_org_id: data.partner_org_id,
        customer_org_id: data.customer_org_id,
        machine_ids: data.machine_ids ?? [],
        analysis_text: data.analysis_text,
        recommendation: data.recommendation as QuoteDraft["recommendation"],
        risk_snapshot: (data.risk_snapshot as Record<string, unknown>) ?? {},
        created_by: data.created_by,
        created_at: data.created_at,
        updated_at: data.updated_at,
        exported_at: data.exported_at,
        customer_org: customerOrg ?? null,
        creator: { display_name: creatorName },
      };
    },
  });
}

export interface CreateQuoteDraftInput {
  customer_org_id: string;
  machine_ids: string[];
  analysis_text: string | null;
  recommendation: "approved" | "conditional" | "rejected" | null;
  risk_snapshot: Record<string, unknown>;
}

export function useCreateQuoteDraft() {
  const queryClient = useQueryClient();
  const { data: activeOrg } = useActiveOrg();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateQuoteDraftInput) => {
      if (!activeOrg?.id || !user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("quote_drafts")
        .insert({
          partner_org_id: activeOrg.id,
          customer_org_id: input.customer_org_id,
          machine_ids: input.machine_ids,
          analysis_text: input.analysis_text,
          recommendation: input.recommendation,
          risk_snapshot: input.risk_snapshot as Json,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-drafts"] });
    },
  });
}

export interface UpdateQuoteDraftInput {
  id: string;
  machine_ids?: string[];
  analysis_text?: string | null;
  recommendation?: "approved" | "conditional" | "rejected" | null;
  risk_snapshot?: Record<string, unknown>;
}

export function useUpdateQuoteDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateQuoteDraftInput) => {
      const { id, risk_snapshot, ...rest } = input;

      const { data, error } = await supabase
        .from("quote_drafts")
        .update({
          ...rest,
          ...(risk_snapshot !== undefined ? { risk_snapshot: risk_snapshot as Json } : {}),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quote-drafts"] });
      queryClient.invalidateQueries({ queryKey: ["quote-draft", variables.id] });
    },
  });
}

export function useExportQuoteDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("quote_drafts")
        .update({ exported_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["quote-drafts"] });
      queryClient.invalidateQueries({ queryKey: ["quote-draft", id] });
    },
  });
}

export const RECOMMENDATION_LABELS: Record<string, string> = {
  approved: "Godkand",
  conditional: "Villkorat godkannande",
  rejected: "Avslagen",
};

export const RECOMMENDATION_COLORS: Record<string, string> = {
  approved: "text-primary bg-primary/10 border-primary/30",
  conditional: "text-warning bg-warning/10 border-warning/30",
  rejected: "text-destructive bg-destructive/10 border-destructive/30",
};

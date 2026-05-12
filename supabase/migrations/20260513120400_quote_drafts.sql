-- ============================================================
-- Migration: Quote Drafts Table
-- ============================================================
-- Partners can create quote drafts to assess risk and make recommendations

CREATE TABLE IF NOT EXISTS public.quote_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  machine_ids uuid[] NOT NULL DEFAULT '{}',
  analysis_text text,
  recommendation text CHECK (recommendation IN ('approved', 'conditional', 'rejected') OR recommendation IS NULL),
  risk_snapshot jsonb DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  exported_at timestamptz
);

ALTER TABLE public.quote_drafts ENABLE ROW LEVEL SECURITY;

-- Select: partner org members can view their org's drafts
CREATE POLICY "quote_drafts_select" ON public.quote_drafts
  FOR SELECT USING (is_org_member(auth.uid(), partner_org_id));

-- Insert: partner org members can create drafts
CREATE POLICY "quote_drafts_insert" ON public.quote_drafts
  FOR INSERT WITH CHECK (
    is_org_member(auth.uid(), partner_org_id)
    AND created_by = auth.uid()
  );

-- Update: only creator can update
CREATE POLICY "quote_drafts_update" ON public.quote_drafts
  FOR UPDATE USING (
    is_org_member(auth.uid(), partner_org_id)
    AND created_by = auth.uid()
  );

-- Delete: only creator can delete
CREATE POLICY "quote_drafts_delete" ON public.quote_drafts
  FOR DELETE USING (
    is_org_member(auth.uid(), partner_org_id)
    AND created_by = auth.uid()
  );

CREATE INDEX IF NOT EXISTS idx_quote_drafts_partner ON public.quote_drafts(partner_org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_drafts_customer ON public.quote_drafts(customer_org_id);

-- Trigger for updated_at
CREATE TRIGGER quote_drafts_updated_at
  BEFORE UPDATE ON public.quote_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Audit trigger
CREATE TRIGGER audit_quote_drafts
  AFTER INSERT OR UPDATE OR DELETE ON public.quote_drafts
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

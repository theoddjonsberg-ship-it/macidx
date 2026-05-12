-- MachIndex Core v0.2 Machine Registry
-- Consolidated migration harvested from Project 2 (loveable2-source)
--
-- INCLUDED TABLES:
--   machines, machine_specs, machine_events, machine_verifications, machine_identity,
--   machine_catalog, machine_catalog_variants, documents, ownership_history,
--   ownership_transfers, machine_qr_tags, data_sharing_consents, consent_access_log,
--   gps_devices, gps_machines, gps_readings
--
-- SKIPPED (per v0.2 scope):
--   insurance_*, finance_*, custody_*, marketplace_*, esg_*, co2_*, crisis_*,
--   salvage_*, fleet_pharmacy_*, status_inspection_*, service_*, predictive_*, ai_*
--
-- RLS: All policies use is_org_member() pattern from v0.1 helpers. No USING(true).

-- ============================================================
-- 1. EXTEND ORGANIZATIONS TABLE
-- ============================================================
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS org_type text
    CHECK (org_type IN ('machine_owner','service_partner','insurance','finance','leasing','dealer','oem'))
    DEFAULT 'machine_owner';

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS contact_person text;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS contact_email text;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS contact_phone text;

-- ============================================================
-- 2. MII LEVEL ENUM
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.mii_level AS ENUM ('L0','L1','L2','L3','L4');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 3. MACHINDEX ID SEQUENCE
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS public.machindex_id_seq START 1;

-- ============================================================
-- 4. UTILITY: update_updated_at_column
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 5. MACHINES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.machines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  type text,
  brand text,
  model text,
  year integer,
  serial_number text,
  registration_number text,
  status text DEFAULT 'active' CHECK (status IN ('active','inactive','sold','scrapped')),
  trust_score integer DEFAULT 0,
  trust_breakdown jsonb DEFAULT '{}'::jsonb,
  verification_level integer DEFAULT 0,
  mii_level public.mii_level DEFAULT 'L0',
  machindex_id text UNIQUE,
  image_url text,
  latitude double precision,
  longitude double precision,
  last_gps_update timestamptz,
  operating_hours integer DEFAULT 0,
  next_service_hours integer,
  estimated_residual_value numeric(14,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;

-- RLS: org members can manage their machines
CREATE POLICY "Org members can view machines"
  ON public.machines FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can insert machines"
  ON public.machines FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can update machines"
  ON public.machines FOR UPDATE TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can delete machines"
  ON public.machines FOR DELETE TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

CREATE TRIGGER update_machines_updated_at
  BEFORE UPDATE ON public.machines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_machines_org ON public.machines(org_id);
CREATE INDEX IF NOT EXISTS idx_machines_serial ON public.machines(serial_number) WHERE serial_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_machines_machindex_id ON public.machines(machindex_id) WHERE machindex_id IS NOT NULL;

-- ============================================================
-- 6. MACHINDEX_ID AUTO-GENERATION TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_machindex_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.machindex_id IS NULL THEN
    NEW.machindex_id := 'MI-SE-2026-' || lpad(nextval('public.machindex_id_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_machindex_id ON public.machines;
CREATE TRIGGER trg_set_machindex_id
  BEFORE INSERT ON public.machines
  FOR EACH ROW EXECUTE FUNCTION public.set_machindex_id();

-- ============================================================
-- 7. MACHINE CATALOG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.machine_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  model text NOT NULL,
  model_slug text,
  category text,
  subcategory text,
  year_from integer,
  year_to integer,
  specs jsonb DEFAULT '{}'::jsonb,
  fuel_type text,
  weight_kg numeric,
  engine_power_kw numeric,
  data_source text DEFAULT 'manual',
  source_url text,
  manufacturing_site text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_catalog_brand_model_fuel_cat
  ON public.machine_catalog (brand, model, COALESCE(fuel_type, ''), COALESCE(category, ''));

CREATE UNIQUE INDEX IF NOT EXISTS machine_catalog_model_slug_key
  ON public.machine_catalog(model_slug)
  WHERE model_slug IS NOT NULL;

ALTER TABLE public.machine_catalog ENABLE ROW LEVEL SECURITY;

-- Catalog is readable by all authenticated users (reference data)
CREATE POLICY "Authenticated users can read catalog"
  ON public.machine_catalog FOR SELECT TO authenticated
  USING (true);

CREATE TRIGGER trg_machine_catalog_updated_at
  BEFORE UPDATE ON public.machine_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 8. MACHINE CATALOG VARIANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.machine_catalog_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id uuid NOT NULL REFERENCES public.machine_catalog(id) ON DELETE CASCADE,
  article_number text NOT NULL,
  variant_name text,
  weight_kg numeric,
  capacity_liters integer,
  width_mm integer,
  height_mm integer,
  working_width_mm integer,
  compatible_weight_min_ton numeric,
  compatible_weight_max_ton numeric,
  source_url text,
  data_source text,
  specs jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (catalog_id, article_number)
);

CREATE INDEX IF NOT EXISTS machine_catalog_variants_catalog_idx
  ON public.machine_catalog_variants(catalog_id);

ALTER TABLE public.machine_catalog_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read variants"
  ON public.machine_catalog_variants FOR SELECT TO authenticated
  USING (true);

CREATE TRIGGER trg_machine_catalog_variants_updated_at
  BEFORE UPDATE ON public.machine_catalog_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 9. MACHINE SPECS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.machine_specs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  field_value text NOT NULL,
  field_type text DEFAULT 'text',
  unit text,
  source text DEFAULT 'manual',
  confidence numeric(3,2),
  verified_by uuid REFERENCES auth.users(id),
  contributed_by uuid REFERENCES auth.users(id),
  catalog_match boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(machine_id, field_key)
);

ALTER TABLE public.machine_specs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage machine specs"
  ON public.machine_specs FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.machines m
      WHERE m.id = machine_specs.machine_id
        AND public.is_org_member(auth.uid(), m.org_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.machines m
      WHERE m.id = machine_specs.machine_id
        AND public.is_org_member(auth.uid(), m.org_id)
    )
  );

CREATE TRIGGER update_machine_specs_updated_at
  BEFORE UPDATE ON public.machine_specs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 10. MACHINE EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.machine_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id),
  event_type text NOT NULL,
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.machine_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view machine events"
  ON public.machine_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.machines m
      WHERE m.id = machine_events.machine_id
        AND public.is_org_member(auth.uid(), m.org_id)
    )
  );

CREATE POLICY "Org members can insert machine events"
  ON public.machine_events FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.machines m
      WHERE m.id = machine_events.machine_id
        AND public.is_org_member(auth.uid(), m.org_id)
    )
  );

CREATE INDEX IF NOT EXISTS idx_machine_events_machine ON public.machine_events(machine_id);
CREATE INDEX IF NOT EXISTS idx_machine_events_time ON public.machine_events(created_at DESC);

-- Enable realtime for machine events
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.machine_events;
  END IF;
END $$;

-- ============================================================
-- 11. MACHINE VERIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.machine_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  verified_by_user_id uuid REFERENCES auth.users(id),
  step text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','failed')),
  provider text,
  verified_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(machine_id, step)
);

ALTER TABLE public.machine_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage verifications"
  ON public.machine_verifications FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.machines m
      WHERE m.id = machine_verifications.machine_id
        AND public.is_org_member(auth.uid(), m.org_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.machines m
      WHERE m.id = machine_verifications.machine_id
        AND public.is_org_member(auth.uid(), m.org_id)
    )
  );

CREATE TRIGGER update_verifications_updated_at
  BEFORE UPDATE ON public.machine_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 12. MACHINE IDENTITY (trust score v2)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.machine_identity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE UNIQUE,
  serial_format_valid boolean DEFAULT false,
  serial_manufacturer_match boolean DEFAULT false,
  ocr_confidence numeric(3,2) DEFAULT 0,
  visual_type_match boolean DEFAULT false,
  visual_type_confidence numeric(3,2) DEFAULT 0,
  oem_assessment text,
  condition_score numeric(3,1) DEFAULT 0,
  duplicate_check_passed boolean DEFAULT false,
  manipulation_check_passed boolean DEFAULT false,
  authenticity_score numeric(3,2) DEFAULT 0,
  identity_score integer DEFAULT 0,
  identity_flags jsonb DEFAULT '[]'::jsonb,
  last_reverification_at timestamptz,
  next_reverification_due timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.machine_identity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage machine identity"
  ON public.machine_identity FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.machines m
      WHERE m.id = machine_identity.machine_id
        AND public.is_org_member(auth.uid(), m.org_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.machines m
      WHERE m.id = machine_identity.machine_id
        AND public.is_org_member(auth.uid(), m.org_id)
    )
  );

CREATE TRIGGER update_machine_identity_updated_at
  BEFORE UPDATE ON public.machine_identity
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 13. DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid REFERENCES public.machines(id) ON DELETE SET NULL,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  title text NOT NULL,
  file_path text NOT NULL,
  file_size_bytes bigint,
  mime_type text,
  version integer DEFAULT 1,
  parent_document_id uuid REFERENCES public.documents(id),
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}'::jsonb,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage documents"
  ON public.documents FOR ALL TO authenticated
  USING (
    public.is_org_member(auth.uid(), org_id)
    OR EXISTS (
      SELECT 1 FROM public.machines m
      WHERE m.id = documents.machine_id
        AND public.is_org_member(auth.uid(), m.org_id)
    )
  )
  WITH CHECK (
    public.is_org_member(auth.uid(), org_id)
    OR EXISTS (
      SELECT 1 FROM public.machines m
      WHERE m.id = documents.machine_id
        AND public.is_org_member(auth.uid(), m.org_id)
    )
  );

CREATE INDEX IF NOT EXISTS idx_documents_machine ON public.documents(machine_id);
CREATE INDEX IF NOT EXISTS idx_documents_org ON public.documents(org_id);

-- ============================================================
-- 14. OWNERSHIP HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ownership_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  from_date timestamptz NOT NULL DEFAULT now(),
  to_date timestamptz,
  transfer_method text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ownership_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view ownership history"
  ON public.ownership_history FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

CREATE INDEX IF NOT EXISTS idx_ownership_history_machine ON public.ownership_history(machine_id);

-- ============================================================
-- 15. OWNERSHIP TRANSFERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ownership_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  from_org_id uuid NOT NULL REFERENCES public.organizations(id),
  to_org_id uuid REFERENCES public.organizations(id),
  to_email text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','accepted','completed','cancelled','expired')),
  transfer_code text UNIQUE DEFAULT encode(extensions.gen_random_bytes(8), 'hex'),
  transfer_code_hash text,
  message text,
  initiated_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ownership_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sender org can view outgoing transfers"
  ON public.ownership_transfers FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), from_org_id));

CREATE POLICY "Receiver org can view incoming transfers"
  ON public.ownership_transfers FOR SELECT TO authenticated
  USING (to_org_id IS NOT NULL AND public.is_org_member(auth.uid(), to_org_id));

CREATE POLICY "Sender org can create transfers"
  ON public.ownership_transfers FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), from_org_id));

CREATE POLICY "Involved orgs can update transfers"
  ON public.ownership_transfers FOR UPDATE TO authenticated
  USING (
    public.is_org_member(auth.uid(), from_org_id)
    OR (to_org_id IS NOT NULL AND public.is_org_member(auth.uid(), to_org_id))
  );

CREATE TRIGGER update_transfers_updated_at
  BEFORE UPDATE ON public.ownership_transfers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Transfer code hash sync trigger
CREATE OR REPLACE FUNCTION public.sync_transfer_code_hash()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.transfer_code IS NOT NULL
     AND (NEW.transfer_code_hash IS NULL
          OR NEW.transfer_code IS DISTINCT FROM OLD.transfer_code) THEN
    NEW.transfer_code_hash := encode(digest(NEW.transfer_code, 'sha256'), 'hex');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_transfer_code_hash ON public.ownership_transfers;
CREATE TRIGGER trg_sync_transfer_code_hash
  BEFORE INSERT OR UPDATE OF transfer_code ON public.ownership_transfers
  FOR EACH ROW EXECUTE FUNCTION public.sync_transfer_code_hash();

-- ============================================================
-- 16. MACHINE QR TAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.machine_qr_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  tag_type text DEFAULT 'digital' CHECK (tag_type IN ('digital','physical','nfc')),
  tag_code text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(6), 'hex'),
  status text DEFAULT 'active' CHECK (status IN ('active','inactive','replaced')),
  ordered_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.machine_qr_tags ENABLE ROW LEVEL SECURITY;

-- Public can read QR tags for verification (e.g. /tag/:code lookup)
CREATE POLICY "Public can read QR tags"
  ON public.machine_qr_tags FOR SELECT
  USING (true);

CREATE POLICY "Org members can create QR tags"
  ON public.machine_qr_tags FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.machines m
      WHERE m.id = machine_qr_tags.machine_id
        AND public.is_org_member(auth.uid(), m.org_id)
    )
  );

CREATE POLICY "Org members can update QR tags"
  ON public.machine_qr_tags FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.machines m
      WHERE m.id = machine_qr_tags.machine_id
        AND public.is_org_member(auth.uid(), m.org_id)
    )
  );

CREATE TRIGGER update_qr_tags_updated_at
  BEFORE UPDATE ON public.machine_qr_tags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 17. QR SCANS (anonymous tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.qr_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machindex_id text NOT NULL,
  scan_time timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  location_lat numeric(10,7),
  location_lng numeric(10,7)
);

CREATE INDEX IF NOT EXISTS idx_qr_scans_machindex ON public.qr_scans(machindex_id);
CREATE INDEX IF NOT EXISTS idx_qr_scans_time ON public.qr_scans(scan_time DESC);
CREATE INDEX IF NOT EXISTS idx_qr_scans_ip_time
  ON public.qr_scans (ip_address, scan_time DESC)
  WHERE ip_address IS NOT NULL;

ALTER TABLE public.qr_scans ENABLE ROW LEVEL SECURITY;

-- Rate-limited public insert for scans
CREATE POLICY "Validated public scans only"
  ON public.qr_scans FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.machine_qr_tags
      WHERE tag_code = qr_scans.machindex_id
        AND status = 'active'
    )
    AND (
      qr_scans.ip_address IS NULL
      OR (
        SELECT count(*) FROM public.qr_scans
        WHERE ip_address = qr_scans.ip_address
          AND scan_time > now() - interval '1 minute'
      ) < 10
    )
  );

-- Machine owners can view scans of their machines
CREATE POLICY "Org members can view QR scans"
  ON public.qr_scans FOR SELECT TO authenticated
  USING (
    machindex_id IN (
      SELECT t.tag_code FROM public.machine_qr_tags t
      JOIN public.machines m ON m.id = t.machine_id
      WHERE public.is_org_member(auth.uid(), m.org_id)
    )
  );

-- ============================================================
-- 18. DATA SHARING CONSENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.data_sharing_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  viewer_org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  viewer_type text NOT NULL CHECK (viewer_type IN ('insurance','finance','leasing','broker','bank','service_partner')),
  consent_level smallint NOT NULL CHECK (consent_level BETWEEN 1 AND 3),
  purpose text,
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  granted_by uuid REFERENCES auth.users(id),
  revoked_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT data_sharing_consents_unique UNIQUE (customer_org_id, viewer_org_id, viewer_type),
  CONSTRAINT data_sharing_consents_not_self CHECK (customer_org_id <> viewer_org_id)
);

CREATE INDEX IF NOT EXISTS idx_dsc_customer ON public.data_sharing_consents(customer_org_id);
CREATE INDEX IF NOT EXISTS idx_dsc_viewer ON public.data_sharing_consents(viewer_org_id);
CREATE INDEX IF NOT EXISTS idx_dsc_active ON public.data_sharing_consents(viewer_org_id, customer_org_id)
  WHERE revoked_at IS NULL;

ALTER TABLE public.data_sharing_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customer org can manage own consents"
  ON public.data_sharing_consents FOR ALL TO authenticated
  USING (public.is_org_member(auth.uid(), customer_org_id))
  WITH CHECK (public.is_org_member(auth.uid(), customer_org_id));

CREATE POLICY "Viewer org can read incoming consents"
  ON public.data_sharing_consents FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), viewer_org_id));

CREATE TRIGGER data_sharing_consents_updated_at
  BEFORE UPDATE ON public.data_sharing_consents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function: get consent level between orgs
CREATE OR REPLACE FUNCTION public.get_consent_level(
  p_customer_org_id uuid,
  p_viewer_org_id uuid
)
RETURNS smallint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(consent_level)::smallint, 0::smallint)
  FROM public.data_sharing_consents
  WHERE customer_org_id = p_customer_org_id
    AND viewer_org_id = p_viewer_org_id
    AND revoked_at IS NULL
    AND (expires_at IS NULL OR expires_at > now());
$$;

GRANT EXECUTE ON FUNCTION public.get_consent_level(uuid, uuid) TO authenticated;

-- ============================================================
-- 19. CONSENT ACCESS LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.consent_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  viewer_org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  consent_level smallint,
  machine_count integer,
  accessed_at timestamptz DEFAULT now(),
  accessed_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_cal_customer_time
  ON public.consent_access_log(customer_org_id, accessed_at DESC);

ALTER TABLE public.consent_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customer can see access log"
  ON public.consent_access_log FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), customer_org_id));

-- ============================================================
-- 20. GPS DEVICES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gps_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  imei text UNIQUE NOT NULL,
  tramigo_device_id integer,
  name text,
  status text DEFAULT 'active' CHECK (status IN ('active','inactive','lost')),
  battery_level integer,
  firmware_version text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.gps_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage GPS devices"
  ON public.gps_devices FOR ALL TO authenticated
  USING (public.is_org_member(auth.uid(), org_id))
  WITH CHECK (public.is_org_member(auth.uid(), org_id));

CREATE TRIGGER update_gps_devices_updated_at
  BEFORE UPDATE ON public.gps_devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 21. GPS MACHINES (link devices to machines)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gps_machines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE UNIQUE,
  device_id uuid REFERENCES public.gps_devices(id) ON DELETE SET NULL,
  device_imei text,
  tramigo_device_id integer,
  linked_at timestamptz DEFAULT now()
);

ALTER TABLE public.gps_machines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage GPS links"
  ON public.gps_machines FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.machines m
      WHERE m.id = gps_machines.machine_id
        AND public.is_org_member(auth.uid(), m.org_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.machines m
      WHERE m.id = gps_machines.machine_id
        AND public.is_org_member(auth.uid(), m.org_id)
    )
  );

-- ============================================================
-- 22. GPS READINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gps_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  latitude numeric(10,7) NOT NULL,
  longitude numeric(10,7) NOT NULL,
  speed numeric(8,1),
  bearing text,
  "timestamp" timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gps_device ON public.gps_readings(device_id);
CREATE INDEX IF NOT EXISTS idx_gps_time ON public.gps_readings("timestamp" DESC);

ALTER TABLE public.gps_readings ENABLE ROW LEVEL SECURITY;

-- GPS readings viewable by org members who own linked machines
CREATE POLICY "Org members can view GPS readings"
  ON public.gps_readings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.gps_machines gm
      JOIN public.machines m ON m.id = gm.machine_id
      WHERE gm.device_imei = gps_readings.device_id
        AND public.is_org_member(auth.uid(), m.org_id)
    )
  );

-- ============================================================
-- 23. MACHINE EVENT TRIGGERS
-- ============================================================

-- Log machine registration
CREATE OR REPLACE FUNCTION public.log_machine_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.machine_events (machine_id, actor_user_id, event_type, title, description, metadata)
  VALUES (
    NEW.id,
    auth.uid(),
    'registration',
    'Maskin registrerad',
    'Maskinen "' || COALESCE(NEW.name, 'Namnlös') || '" registrerades i systemet.',
    jsonb_build_object('name', NEW.name, 'brand', NEW.brand, 'model', NEW.model)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_machine_registration ON public.machines;
CREATE TRIGGER trg_machine_registration
  AFTER INSERT ON public.machines
  FOR EACH ROW EXECUTE FUNCTION public.log_machine_registration();

-- Log machine status change
CREATE OR REPLACE FUNCTION public.log_machine_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.machine_events (machine_id, actor_user_id, event_type, title, description, metadata)
    VALUES (
      NEW.id,
      auth.uid(),
      'status_change',
      'Status ändrad',
      'Status ändrades från "' || COALESCE(OLD.status, 'okänd') || '" till "' || COALESCE(NEW.status, 'okänd') || '".',
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_machine_status_change ON public.machines;
CREATE TRIGGER trg_machine_status_change
  AFTER UPDATE ON public.machines
  FOR EACH ROW EXECUTE FUNCTION public.log_machine_status_change();

-- ============================================================
-- 24. UPDATE NOTIFICATIONS TYPE CHECK
-- ============================================================
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'team_invite_accepted',
  'password_changed',
  'welcome',
  'org_invite_received',
  'machine_registered',
  'machine_transfer_initiated',
  'machine_transfer_completed',
  'verification_completed'
));

-- ============================================================
-- 25. AUDIT TRIGGERS FOR MACHINE TABLES
-- ============================================================
DROP TRIGGER IF EXISTS audit_machines ON public.machines;
CREATE TRIGGER audit_machines
  AFTER INSERT OR UPDATE OR DELETE ON public.machines
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_ownership_transfers ON public.ownership_transfers;
CREATE TRIGGER audit_ownership_transfers
  AFTER INSERT OR UPDATE ON public.ownership_transfers
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- =============================================================================
-- MachIndex v0.3: AI Trust Boost
-- =============================================================================
-- Adds verification_metadata column and AI-OCR trust boost
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Add verification_metadata column to machines
-- -----------------------------------------------------------------------------
ALTER TABLE public.machines
ADD COLUMN IF NOT EXISTS verification_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.machines.verification_metadata IS 'Metadata about machine verification, including AI-OCR source and confidence scores';

-- -----------------------------------------------------------------------------
-- 2. Update recalc_machine_mii_and_trust with AI-OCR boost
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalc_machine_mii_and_trust(_machine_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_machine          public.machines%ROWTYPE;
  v_doc_count        int;
  v_photo_count      int;
  v_insurance_count  int;
  v_event_count      int;
  v_has_gps          boolean;
  v_has_verification boolean;
  v_completeness     numeric;
  v_filled_fields    int;
  v_total_fields     int := 12;
  v_mii              public.mii_level;
  v_score_identity   numeric;
  v_score_documents  numeric;
  v_score_verify     numeric;
  v_score_history    numeric;
  v_total_score      int;
BEGIN
  SELECT * INTO v_machine FROM public.machines WHERE id = _machine_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- Counts
  SELECT count(*) INTO v_doc_count FROM public.documents
    WHERE machine_id = _machine_id AND deleted_at IS NULL;
  SELECT count(*) INTO v_photo_count FROM public.documents
    WHERE machine_id = _machine_id AND deleted_at IS NULL
    AND document_type IN ('photo','nameplate_photo','typskyltsfoto','foto','type_plate');
  SELECT count(*) INTO v_insurance_count FROM public.documents
    WHERE machine_id = _machine_id AND deleted_at IS NULL
    AND document_type IN ('insurance_policy','försäkringsbrev','försäkring','insurance');
  SELECT count(*) INTO v_event_count FROM public.machine_events
    WHERE machine_id = _machine_id;
  SELECT EXISTS(
    SELECT 1 FROM public.gps_machines gm
    JOIN public.gps_devices gd ON gd.id = gm.device_id
    WHERE gm.machine_id = _machine_id AND gd.status = 'active'
  ) INTO v_has_gps;
  SELECT EXISTS(
    SELECT 1 FROM public.machine_verifications
    WHERE machine_id = _machine_id AND status = 'completed'
  ) INTO v_has_verification;

  -- Field completeness (12 fields)
  v_filled_fields :=
    (CASE WHEN v_machine.brand IS NOT NULL AND v_machine.brand <> '' THEN 1 ELSE 0 END) +
    (CASE WHEN v_machine.model IS NOT NULL AND v_machine.model <> '' THEN 1 ELSE 0 END) +
    (CASE WHEN v_machine.serial_number IS NOT NULL AND v_machine.serial_number <> '' THEN 1 ELSE 0 END) +
    (CASE WHEN v_machine.year IS NOT NULL AND v_machine.year > 0 THEN 1 ELSE 0 END) +
    (CASE WHEN v_machine.type IS NOT NULL AND v_machine.type <> '' THEN 1 ELSE 0 END) +
    (CASE WHEN v_machine.operating_hours IS NOT NULL AND v_machine.operating_hours > 0 THEN 1 ELSE 0 END) +
    (CASE WHEN v_machine.registration_number IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN v_machine.image_url IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN v_machine.estimated_residual_value IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN v_machine.latitude IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN v_machine.next_service_hours IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN v_machine.name IS NOT NULL AND v_machine.name <> '' THEN 1 ELSE 0 END);

  -- MII LEVEL
  IF v_machine.status = 'draft' OR v_filled_fields < 4 THEN
    v_mii := 'L0';
  ELSIF v_machine.brand IS NULL OR v_machine.model IS NULL
     OR v_machine.serial_number IS NULL OR v_machine.year IS NULL THEN
    v_mii := 'L0';
  ELSIF v_doc_count = 0 THEN
    v_mii := 'L1';
  ELSIF NOT v_has_verification THEN
    v_mii := 'L2';
  ELSIF NOT v_has_gps OR v_photo_count < 3 OR v_insurance_count = 0 THEN
    v_mii := 'L3';
  ELSE
    v_mii := 'L4';
  END IF;

  -- TRUST SCORE (4 categories, max 25 each)
  v_score_identity := LEAST(25, (v_filled_fields::numeric / v_total_fields) * 25);
  v_score_documents := LEAST(25, (v_doc_count::numeric / 5) * 25);
  v_score_verify := CASE v_mii
    WHEN 'L0' THEN 0
    WHEN 'L1' THEN 6.25
    WHEN 'L2' THEN 12.5
    WHEN 'L3' THEN 18.75
    WHEN 'L4' THEN 25
  END;
  v_score_history := LEAST(25, (v_event_count::numeric / 10) * 25);

  -- AI-OCR boost: +3 to identity score if machine was registered via AI-OCR
  IF v_machine.verification_metadata->>'source' = 'ai_ocr' THEN
    v_score_identity := LEAST(25, v_score_identity + 3);
  END IF;

  v_total_score := round(v_score_identity + v_score_documents + v_score_verify + v_score_history);

  UPDATE public.machines
  SET
    mii_level = v_mii,
    trust_score = v_total_score,
    trust_breakdown = jsonb_build_object(
      'identity', round(v_score_identity),
      'documents', round(v_score_documents),
      'verification', round(v_score_verify),
      'history', round(v_score_history),
      'identity_max', 25,
      'documents_max', 25,
      'verification_max', 25,
      'history_max', 25,
      'filled_fields', v_filled_fields,
      'total_fields', v_total_fields,
      'doc_count', v_doc_count,
      'photo_count', v_photo_count,
      'insurance_count', v_insurance_count,
      'event_count', v_event_count,
      'has_gps', v_has_gps,
      'has_verification', v_has_verification,
      'ai_ocr_boost', v_machine.verification_metadata->>'source' = 'ai_ocr',
      'recalculated_at', now()
    ),
    updated_at = now()
  WHERE id = _machine_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. Update trigger to include verification_metadata changes
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_recalc_machine_guarded()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Avoid recursion: only recalc if recalc-triggering fields changed
  IF TG_OP = 'INSERT' OR
     OLD.brand IS DISTINCT FROM NEW.brand OR
     OLD.model IS DISTINCT FROM NEW.model OR
     OLD.serial_number IS DISTINCT FROM NEW.serial_number OR
     OLD.year IS DISTINCT FROM NEW.year OR
     OLD.type IS DISTINCT FROM NEW.type OR
     OLD.operating_hours IS DISTINCT FROM NEW.operating_hours OR
     OLD.status IS DISTINCT FROM NEW.status OR
     OLD.registration_number IS DISTINCT FROM NEW.registration_number OR
     OLD.image_url IS DISTINCT FROM NEW.image_url OR
     OLD.estimated_residual_value IS DISTINCT FROM NEW.estimated_residual_value OR
     OLD.latitude IS DISTINCT FROM NEW.latitude OR
     OLD.next_service_hours IS DISTINCT FROM NEW.next_service_hours OR
     OLD.name IS DISTINCT FROM NEW.name OR
     OLD.verification_metadata IS DISTINCT FROM NEW.verification_metadata
  THEN
    PERFORM public.recalc_machine_mii_and_trust(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- Done
-- -----------------------------------------------------------------------------

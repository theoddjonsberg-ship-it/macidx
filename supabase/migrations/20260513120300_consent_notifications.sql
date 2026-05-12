-- ============================================================
-- Migration: Consent Notification Triggers
-- ============================================================
-- Adds notification types for consent_received and consent_revoked
-- Creates triggers to notify partner org admins when consent is granted/revoked

-- ============================================================
-- 1. UPDATE NOTIFICATIONS TYPE CHECK
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
  'verification_completed',
  'consent_received',
  'consent_revoked'
));

-- ============================================================
-- 2. CONSENT GRANTED NOTIFICATION TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_consent_granted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_name text;
  v_purpose text;
  v_level_label text;
BEGIN
  -- Get customer org name
  SELECT name INTO v_customer_name
  FROM organizations
  WHERE id = NEW.customer_org_id;

  v_purpose := COALESCE(NEW.purpose, 'datadelning');

  -- Map consent level to label
  CASE NEW.consent_level
    WHEN 1 THEN v_level_label := 'Översikt';
    WHEN 2 THEN v_level_label := 'Anonymiserad';
    WHEN 3 THEN v_level_label := 'Full insyn';
    ELSE v_level_label := 'Nivå ' || NEW.consent_level::text;
  END CASE;

  -- Send notification to all owners/admins in the viewer org
  INSERT INTO notifications (user_id, org_id, type, title, body, link)
  SELECT
    ur.user_id,
    NEW.viewer_org_id,
    'consent_received',
    'Nytt samtycke från ' || v_customer_name,
    v_customer_name || ' har delat maskindata med er. Åtkomstnivå: ' || v_level_label || '. Syfte: ' || v_purpose || '.',
    '/partner/portfolio'
  FROM user_roles ur
  WHERE ur.org_id = NEW.viewer_org_id
    AND ur.role IN ('owner', 'admin');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_consent_notification ON data_sharing_consents;
CREATE TRIGGER trg_consent_notification
  AFTER INSERT ON data_sharing_consents
  FOR EACH ROW EXECUTE FUNCTION handle_consent_granted();

-- ============================================================
-- 3. CONSENT REVOKED NOTIFICATION TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_consent_revoked()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_name text;
BEGIN
  -- Only trigger if revoked_at was just set (changed from NULL to a value)
  IF OLD.revoked_at IS NULL AND NEW.revoked_at IS NOT NULL THEN
    -- Get customer org name
    SELECT name INTO v_customer_name
    FROM organizations
    WHERE id = NEW.customer_org_id;

    -- Send notification to all owners/admins in the viewer org
    INSERT INTO notifications (user_id, org_id, type, title, body, link)
    SELECT
      ur.user_id,
      NEW.viewer_org_id,
      'consent_revoked',
      'Samtycke återkallat från ' || v_customer_name,
      v_customer_name || ' har återkallat datadelningen. Ni har inte längre tillgång till deras maskindata.',
      '/partner/portfolio'
    FROM user_roles ur
    WHERE ur.org_id = NEW.viewer_org_id
      AND ur.role IN ('owner', 'admin');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_consent_revoked_notification ON data_sharing_consents;
CREATE TRIGGER trg_consent_revoked_notification
  AFTER UPDATE ON data_sharing_consents
  FOR EACH ROW EXECUTE FUNCTION handle_consent_revoked();

-- ============================================================
-- 4. AUDIT TRIGGER FOR CONSENTS
-- ============================================================
DROP TRIGGER IF EXISTS audit_data_sharing_consents ON public.data_sharing_consents;
CREATE TRIGGER audit_data_sharing_consents
  AFTER INSERT OR UPDATE OR DELETE ON public.data_sharing_consents
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

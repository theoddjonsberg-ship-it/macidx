-- MachIndex Core v0.1 Foundation
-- Step 1.4: Triggers
-- handle_new_user, handle_org_creation, log_audit_event, touch_updated_at

-- ============================================================
-- handle_new_user: create profiles row for every new auth.users
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id,
    NULLIF(NEW.raw_user_meta_data->>'display_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- handle_org_creation: add creator as member + owner role
-- Uses auth.uid() — requires the org to be created by an authenticated user.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_org_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator uuid := auth.uid();
BEGIN
  IF v_creator IS NULL THEN
    RETURN NEW; -- service/admin-created orgs skip auto-membership
  END IF;

  INSERT INTO public.organization_members (org_id, user_id)
  VALUES (NEW.id, v_creator)
  ON CONFLICT (org_id, user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, org_id, role)
  VALUES (v_creator, NEW.id, 'owner')
  ON CONFLICT (user_id, org_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_organization_created
AFTER INSERT ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.handle_org_creation();

-- ============================================================
-- touch_updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER touch_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER touch_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- log_audit_event: append-only audit trail for auditable tables
-- Stores changed column names + redacted metadata, never PII.
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action       text;
  v_changed      text[];
  v_metadata     jsonb := '{}'::jsonb;
  v_row          jsonb;
  v_org_id       uuid;
  v_entity_id    uuid;
BEGIN
  v_row := to_jsonb(COALESCE(NEW, OLD));

  IF TG_OP = 'INSERT' THEN
    v_action := 'insert';
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    SELECT array_agg(key ORDER BY key)
      INTO v_changed
      FROM jsonb_each(to_jsonb(NEW)) AS new_kv(key, value)
     WHERE to_jsonb(NEW) -> key IS DISTINCT FROM to_jsonb(OLD) -> key
       AND key NOT IN ('updated_at');
    v_metadata := jsonb_build_object('changed', COALESCE(v_changed, ARRAY[]::text[]));
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
  END IF;

  IF TG_TABLE_NAME = 'organizations' THEN
    v_org_id := (v_row ->> 'id')::uuid;
  ELSIF v_row ? 'org_id' THEN
    v_org_id := NULLIF(v_row ->> 'org_id', '')::uuid;
  ELSE
    v_org_id := NULL;
  END IF;

  v_entity_id := (v_row ->> 'id')::uuid;

  INSERT INTO public.audit_log (
    org_id, actor_user_id, action, entity_type, entity_id, metadata
  )
  VALUES (
    v_org_id,
    auth.uid(),
    v_action,
    TG_TABLE_NAME,
    v_entity_id,
    v_metadata
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_profiles
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_organizations
AFTER INSERT OR UPDATE OR DELETE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_organization_members
AFTER INSERT OR UPDATE OR DELETE ON public.organization_members
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_user_roles
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

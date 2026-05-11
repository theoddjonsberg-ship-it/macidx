-- MachIndex Core v0.1 Foundation
-- Step 1.2: Helper functions (5 SECURITY DEFINER) + sole-owner protection

-- ============================================================
-- has_org_role
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_org_role(
  _user uuid,
  _org uuid,
  _role public.app_role
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user
      AND org_id = _org
      AND role   = _role
  );
$$;

-- ============================================================
-- has_platform_role
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_platform_role(
  _user uuid,
  _role public.app_role
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user
      AND org_id IS NULL
      AND role   = _role
  );
$$;

-- ============================================================
-- is_org_member
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_org_member(
  _user uuid,
  _org uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user
      AND org_id  = _org
  );
$$;

-- ============================================================
-- shares_org_with
-- ============================================================
CREATE OR REPLACE FUNCTION public.shares_org_with(
  _a uuid,
  _b uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members a
    JOIN public.organization_members b USING (org_id)
    WHERE a.user_id = _a
      AND b.user_id = _b
  );
$$;

-- ============================================================
-- can_assign_role
-- Rules:
--   - platform_admin can assign anything
--   - owner can assign owner/admin/member/viewer
--   - admin can assign member/viewer
--   - member/viewer cannot assign anything
--   - users cannot grant themselves a role they don't already have
--     (covered: actor's privilege is checked against the role being granted)
-- ============================================================
CREATE OR REPLACE FUNCTION public.can_assign_role(
  _actor uuid,
  _org uuid,
  _role public.app_role
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _actor IS NULL THEN
    RETURN false;
  END IF;

  IF public.has_platform_role(_actor, 'platform_admin') THEN
    RETURN true;
  END IF;

  -- Non-platform roles always require an org
  IF _org IS NULL OR _role = 'platform_admin' THEN
    RETURN false;
  END IF;

  IF public.has_org_role(_actor, _org, 'owner') THEN
    RETURN _role IN ('owner','admin','member','viewer');
  END IF;

  IF public.has_org_role(_actor, _org, 'admin') THEN
    RETURN _role IN ('member','viewer');
  END IF;

  RETURN false;
END;
$$;

-- ============================================================
-- prevent_sole_owner_removal
-- Trigger guards against demoting/removing the last owner of an org.
-- ============================================================
CREATE OR REPLACE FUNCTION public.prevent_sole_owner_removal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid;
  v_remaining int;
BEGIN
  IF TG_OP = 'DELETE' AND OLD.role = 'owner' THEN
    v_org := OLD.org_id;
  ELSIF TG_OP = 'UPDATE'
        AND OLD.role = 'owner'
        AND (NEW.role IS DISTINCT FROM 'owner' OR NEW.org_id IS DISTINCT FROM OLD.org_id) THEN
    v_org := OLD.org_id;
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT count(*) INTO v_remaining
  FROM public.user_roles
  WHERE org_id = v_org
    AND role   = 'owner'
    AND id <> OLD.id;

  IF v_remaining = 0 THEN
    RAISE EXCEPTION 'Cannot remove the sole owner of organization %', v_org
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER prevent_sole_owner_removal_trigger
BEFORE UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.prevent_sole_owner_removal();

-- MachIndex Core v0.1 Foundation
-- RPCs for accepting invitations by ID (for logged-in users who received notification)

-- ============================================================
-- get_invitation_preview: returns invitation details if caller's email matches
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_invitation_preview(_invitation_id uuid)
RETURNS TABLE (
  org_id uuid,
  org_name text,
  role public.app_role,
  expires_at timestamptz,
  is_consumed boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email text;
  v_invitation public.org_invitations%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Get caller's email
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();

  -- Fetch invitation
  SELECT * INTO v_invitation
  FROM public.org_invitations
  WHERE id = _invitation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found'
      USING ERRCODE = 'no_data_found';
  END IF;

  -- Verify email match
  IF LOWER(v_user_email) <> LOWER(v_invitation.email) THEN
    RAISE EXCEPTION 'Invitation belongs to another email'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Return preview
  RETURN QUERY
  SELECT
    v_invitation.org_id,
    o.name,
    v_invitation.role,
    v_invitation.expires_at,
    (v_invitation.consumed_at IS NOT NULL)
  FROM public.organizations o
  WHERE o.id = v_invitation.org_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_invitation_preview(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invitation_preview(uuid) TO authenticated;

-- ============================================================
-- accept_invitation_by_id: accept invitation by ID (no token needed)
-- Requires caller's email to match invitation email
-- ============================================================
CREATE OR REPLACE FUNCTION public.accept_invitation_by_id(_invitation_id uuid)
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    uuid := auth.uid();
  v_user_email text;
  v_invitation public.org_invitations%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Get caller's email
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;

  -- Fetch invitation
  SELECT * INTO v_invitation
  FROM public.org_invitations
  WHERE id = _invitation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found'
      USING ERRCODE = 'no_data_found';
  END IF;

  -- Verify email match
  IF LOWER(v_user_email) <> LOWER(v_invitation.email) THEN
    RAISE EXCEPTION 'Invitation belongs to another email'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF v_invitation.consumed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Invitation already consumed'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF v_invitation.expires_at < now() THEN
    RAISE EXCEPTION 'Invitation expired'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- Add membership
  INSERT INTO public.organization_members (org_id, user_id)
  VALUES (v_invitation.org_id, v_user_id)
  ON CONFLICT (org_id, user_id) DO NOTHING;

  -- Add role
  INSERT INTO public.user_roles (user_id, org_id, role)
  VALUES (v_user_id, v_invitation.org_id, v_invitation.role)
  ON CONFLICT (user_id, org_id, role) DO NOTHING;

  -- Mark consumed
  UPDATE public.org_invitations
     SET consumed_at = now(),
         consumed_by = v_user_id
   WHERE id = v_invitation.id;

  -- Notify the inviter
  INSERT INTO public.notifications (user_id, org_id, type, title, body)
  VALUES (
    v_invitation.invited_by,
    v_invitation.org_id,
    'team_invite_accepted',
    'Inbjudan accepterad',
    'En ny medlem har gått med i din organisation.'
  );

  RETURN v_invitation.org_id;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_invitation_by_id(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_invitation_by_id(uuid) TO authenticated;

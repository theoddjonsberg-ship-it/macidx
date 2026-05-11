-- MachIndex Core v0.1 Foundation
-- Step 1.5: RPCs (SECURITY DEFINER)
-- accept_invitation, record_login_attempt

-- ============================================================
-- accept_invitation
-- Hashes token, validates, inserts membership + role, marks consumed.
-- Returns the org_id the user joined.
-- ============================================================
CREATE OR REPLACE FUNCTION public.accept_invitation(_token text)
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation public.org_invitations%ROWTYPE;
  v_token_hash text;
  v_user_id    uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF _token IS NULL OR length(_token) = 0 THEN
    RAISE EXCEPTION 'Missing invitation token'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  v_token_hash := encode(digest(_token, 'sha256'), 'hex');

  SELECT * INTO v_invitation
  FROM public.org_invitations
  WHERE token_hash = v_token_hash;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found'
      USING ERRCODE = 'no_data_found';
  END IF;

  IF v_invitation.consumed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Invitation already consumed'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF v_invitation.expires_at < now() THEN
    RAISE EXCEPTION 'Invitation expired'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  INSERT INTO public.organization_members (org_id, user_id)
  VALUES (v_invitation.org_id, v_user_id)
  ON CONFLICT (org_id, user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, org_id, role)
  VALUES (v_user_id, v_invitation.org_id, v_invitation.role)
  ON CONFLICT (user_id, org_id, role) DO NOTHING;

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
    'Invitation accepted',
    'A new member joined your organization.'
  );

  RETURN v_invitation.org_id;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;

-- ============================================================
-- record_login_attempt
-- Called pre- and post-signIn. Hashes inputs, records, triggers
-- lockout auth_event after 5 failures in 15 minutes.
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_login_attempt(
  _email   text,
  _ip      text,
  _success boolean
)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email_hash      text;
  v_ip_hash         text;
  v_recent_failures int;
BEGIN
  IF _email IS NULL OR length(_email) = 0 THEN
    RAISE EXCEPTION 'Missing email'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  v_email_hash := encode(digest(lower(_email), 'sha256'), 'hex');
  v_ip_hash    := encode(digest(COALESCE(_ip, ''), 'sha256'), 'hex');

  INSERT INTO public.login_attempts (email_hash, ip_hash, success)
  VALUES (v_email_hash, v_ip_hash, _success);

  IF NOT _success THEN
    SELECT count(*) INTO v_recent_failures
      FROM public.login_attempts
     WHERE email_hash = v_email_hash
       AND success    = false
       AND attempted_at > now() - interval '15 minutes';

    IF v_recent_failures >= 5 THEN
      INSERT INTO public.auth_events (event_type, ip_hash, severity, metadata)
      VALUES (
        'lockout_triggered',
        v_ip_hash,
        'high',
        jsonb_build_object(
          'email_hash',     v_email_hash,
          'failures_15min', v_recent_failures
        )
      );
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.record_login_attempt(text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_login_attempt(text, text, boolean) TO anon, authenticated;

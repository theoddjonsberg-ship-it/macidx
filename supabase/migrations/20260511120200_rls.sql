-- MachIndex Core v0.1 Foundation
-- Step 1.3: RLS policies for all 9 tables
-- Rules: no USING(true). All cross-org reads gated through helpers.
-- Operations without a policy are denied by default.

-- ============================================================
-- profiles
-- ============================================================
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.shares_org_with(auth.uid(), user_id)
  );

CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
-- DELETE: no policy = denied

-- ============================================================
-- organizations
-- ============================================================
CREATE POLICY organizations_select ON public.organizations
  FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), id));

CREATE POLICY organizations_insert ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY organizations_update ON public.organizations
  FOR UPDATE TO authenticated
  USING (
    public.has_org_role(auth.uid(), id, 'owner')
    OR public.has_org_role(auth.uid(), id, 'admin')
  )
  WITH CHECK (
    public.has_org_role(auth.uid(), id, 'owner')
    OR public.has_org_role(auth.uid(), id, 'admin')
  );
-- DELETE: no policy = denied

-- ============================================================
-- organization_members
-- ============================================================
CREATE POLICY organization_members_select ON public.organization_members
  FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

-- INSERT: no policy = denied. The handle_org_creation trigger inserts
-- the creator's membership server-side (SECURITY DEFINER, bypasses RLS).
-- accept_invitation RPC inserts members the same way.

CREATE POLICY organization_members_delete ON public.organization_members
  FOR DELETE TO authenticated
  USING (
    public.has_org_role(auth.uid(), org_id, 'owner')
    OR public.has_org_role(auth.uid(), org_id, 'admin')
    OR user_id = auth.uid()
  );

-- ============================================================
-- user_roles
-- ============================================================
CREATE POLICY user_roles_select ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_org_role(auth.uid(), org_id, 'owner')
    OR public.has_org_role(auth.uid(), org_id, 'admin')
  );

CREATE POLICY user_roles_insert ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.can_assign_role(auth.uid(), org_id, role));

CREATE POLICY user_roles_update ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.can_assign_role(auth.uid(), org_id, role))
  WITH CHECK (public.can_assign_role(auth.uid(), org_id, role));

CREATE POLICY user_roles_delete ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.can_assign_role(auth.uid(), org_id, role));

-- ============================================================
-- org_invitations
-- ============================================================
CREATE POLICY org_invitations_select ON public.org_invitations
  FOR SELECT TO authenticated
  USING (
    public.has_org_role(auth.uid(), org_id, 'owner')
    OR public.has_org_role(auth.uid(), org_id, 'admin')
  );

CREATE POLICY org_invitations_insert ON public.org_invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    invited_by = auth.uid()
    AND (
      public.has_org_role(auth.uid(), org_id, 'owner')
      OR public.has_org_role(auth.uid(), org_id, 'admin')
    )
  );

CREATE POLICY org_invitations_update ON public.org_invitations
  FOR UPDATE TO authenticated
  USING (
    public.has_org_role(auth.uid(), org_id, 'owner')
    OR public.has_org_role(auth.uid(), org_id, 'admin')
  )
  WITH CHECK (
    public.has_org_role(auth.uid(), org_id, 'owner')
    OR public.has_org_role(auth.uid(), org_id, 'admin')
  );
-- DELETE: no policy = denied

-- ============================================================
-- login_attempts (no client access)
-- ============================================================
-- No policies. Writes happen via record_login_attempt RPC (SECURITY DEFINER).

-- ============================================================
-- auth_events
-- ============================================================
CREATE POLICY auth_events_select ON public.auth_events
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_platform_role(auth.uid(), 'platform_admin')
  );
-- INSERT/UPDATE/DELETE: no policy = denied. Writes via SECURITY DEFINER funcs.

-- ============================================================
-- audit_log
-- ============================================================
CREATE POLICY audit_log_select ON public.audit_log
  FOR SELECT TO authenticated
  USING (
    public.is_org_member(auth.uid(), org_id)
    AND (
      public.has_org_role(auth.uid(), org_id, 'owner')
      OR public.has_org_role(auth.uid(), org_id, 'admin')
      OR actor_user_id = auth.uid()
    )
  );
-- INSERT/UPDATE/DELETE: no policy = denied. Trigger writes via SECURITY DEFINER.

-- ============================================================
-- notifications
-- ============================================================
CREATE POLICY notifications_select ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Only allow flipping read_at on your own notifications.
CREATE POLICY notifications_update ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
-- INSERT/DELETE: no policy = denied. Triggers/RPCs handle inserts.

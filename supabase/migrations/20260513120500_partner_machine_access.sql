-- ============================================================
-- PARTNER MACHINE ACCESS VIA CONSENT
-- ============================================================
-- Allows partners (finance, insurance, leasing, service_partner)
-- to view machines belonging to customer orgs they have active consent from.
-- ============================================================

-- Policy: Partners can view machines from consented customer orgs
CREATE POLICY "Partners can view consented machines"
  ON public.machines FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.data_sharing_consents dsc
      WHERE dsc.customer_org_id = machines.org_id
        AND public.is_org_member(auth.uid(), dsc.viewer_org_id)
        AND dsc.revoked_at IS NULL
        AND (dsc.expires_at IS NULL OR dsc.expires_at > now())
    )
  );

-- Similarly for documents: partners with consent can view machine documents
CREATE POLICY "Partners can view consented machine documents"
  ON public.documents FOR SELECT TO authenticated
  USING (
    machine_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.machines m
      JOIN public.data_sharing_consents dsc ON dsc.customer_org_id = m.org_id
      WHERE m.id = documents.machine_id
        AND public.is_org_member(auth.uid(), dsc.viewer_org_id)
        AND dsc.revoked_at IS NULL
        AND (dsc.expires_at IS NULL OR dsc.expires_at > now())
    )
  );

-- Partners can view machine events for consented machines
CREATE POLICY "Partners can view consented machine events"
  ON public.machine_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.machines m
      JOIN public.data_sharing_consents dsc ON dsc.customer_org_id = m.org_id
      WHERE m.id = machine_events.machine_id
        AND public.is_org_member(auth.uid(), dsc.viewer_org_id)
        AND dsc.revoked_at IS NULL
        AND (dsc.expires_at IS NULL OR dsc.expires_at > now())
    )
  );

-- Partners can view ownership history for consented machines
CREATE POLICY "Partners can view consented ownership history"
  ON public.ownership_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.machines m
      JOIN public.data_sharing_consents dsc ON dsc.customer_org_id = m.org_id
      WHERE m.id = ownership_history.machine_id
        AND public.is_org_member(auth.uid(), dsc.viewer_org_id)
        AND dsc.revoked_at IS NULL
        AND (dsc.expires_at IS NULL OR dsc.expires_at > now())
    )
  );

-- Partners can view customer org basic info when they have consent
CREATE POLICY "Partners can view consented customer orgs"
  ON public.organizations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.data_sharing_consents dsc
      WHERE dsc.customer_org_id = organizations.id
        AND public.is_org_member(auth.uid(), dsc.viewer_org_id)
        AND dsc.revoked_at IS NULL
        AND (dsc.expires_at IS NULL OR dsc.expires_at > now())
    )
  );

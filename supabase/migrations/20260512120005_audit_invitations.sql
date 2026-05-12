-- MachIndex Core v0.1 Foundation
-- Add audit trigger for org_invitations

DROP TRIGGER IF EXISTS audit_org_invitations ON public.org_invitations;

CREATE TRIGGER audit_org_invitations
AFTER INSERT OR UPDATE ON public.org_invitations
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

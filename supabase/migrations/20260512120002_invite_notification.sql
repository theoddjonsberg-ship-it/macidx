-- MachIndex Core v0.1 Foundation
-- Add org_invite_received notification type + trigger to notify existing users on invitation

-- ============================================================
-- Extend notifications type constraint to include org_invite_received
-- ============================================================
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'team_invite_accepted',
  'password_changed',
  'welcome',
  'org_invite_received'
));

-- ============================================================
-- handle_org_invitation: when an invitation is created, check if
-- the email belongs to an existing user. If so, create a notification.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_org_invitation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_user_id uuid;
  v_org_name text;
BEGIN
  -- Only on INSERT
  IF TG_OP <> 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Look up user by email
  SELECT id INTO v_target_user_id
  FROM auth.users
  WHERE LOWER(email) = LOWER(NEW.email);

  IF v_target_user_id IS NULL THEN
    -- User doesn't exist yet, no notification
    RETURN NEW;
  END IF;

  -- Get org name for notification body
  SELECT name INTO v_org_name
  FROM public.organizations
  WHERE id = NEW.org_id;

  -- Create notification with link to accept page
  INSERT INTO public.notifications (
    user_id,
    org_id,
    type,
    title,
    body,
    link
  ) VALUES (
    v_target_user_id,
    NEW.org_id,
    'org_invite_received',
    'Du har blivit inbjuden',
    COALESCE('Du har fått en inbjudan till ' || v_org_name, 'Du har fått en inbjudan'),
    '/invite/' || NEW.id::text
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_org_invitation_created ON public.org_invitations;

CREATE TRIGGER on_org_invitation_created
AFTER INSERT ON public.org_invitations
FOR EACH ROW EXECUTE FUNCTION public.handle_org_invitation();

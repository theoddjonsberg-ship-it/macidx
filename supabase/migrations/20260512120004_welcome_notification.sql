-- MachIndex Core v0.1 Foundation
-- Update handle_new_user to also create a welcome notification

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id,
    NULLIF(NEW.raw_user_meta_data->>'display_name', '')
  );

  -- Create welcome notification
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    body
  ) VALUES (
    NEW.id,
    'welcome',
    'Välkommen till MachIndex',
    'Slutför din onboarding för att komma igång.'
  );

  RETURN NEW;
END;
$$;

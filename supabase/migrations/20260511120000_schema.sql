-- MachIndex Core v0.1 Foundation
-- Step 1.1: Schema (enum + 9 tables + RLS enable + indexes)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- Enum: app_role (exactly 5 values, never extended)
-- ============================================================
CREATE TYPE public.app_role AS ENUM (
  'owner',
  'admin',
  'member',
  'viewer',
  'platform_admin'
);

-- ============================================================
-- profiles
-- experience_role lives here as text, NEVER in app_role
-- ============================================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  experience_role text NULL CHECK (
    experience_role IN ('machine_owner','service_tech','oem','bank_finance','insurance')
  ),
  language text DEFAULT 'sv' CHECK (language IN ('sv','en')),
  onboarding_completed_at timestamptz NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- organizations
-- ============================================================
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  org_number text NULL,
  country text NULL,
  logo_url text NULL,
  timezone text DEFAULT 'Europe/Stockholm',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- organization_members (membership only, no roles)
-- ============================================================
CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- ============================================================
-- user_roles (roles separated from membership)
-- org_id NULL only for platform_admin
-- ============================================================
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, org_id, role),
  CHECK (
    (role = 'platform_admin' AND org_id IS NULL) OR
    (role <> 'platform_admin' AND org_id IS NOT NULL)
  )
);

-- ============================================================
-- org_invitations
-- ============================================================
CREATE TABLE public.org_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.app_role NOT NULL CHECK (role IN ('admin','member','viewer')),
  token_hash text NOT NULL UNIQUE,
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  consumed_at timestamptz NULL,
  consumed_by uuid NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- login_attempts (service/RPC write only)
-- ============================================================
CREATE TABLE public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash text NOT NULL,
  ip_hash text NOT NULL,
  success boolean NOT NULL,
  attempted_at timestamptz DEFAULT now()
);

-- ============================================================
-- auth_events
-- ============================================================
CREATE TABLE public.auth_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'login_success',
    'login_failed',
    'password_reset_requested',
    'password_changed',
    'lockout_triggered',
    'intrusion_detected'
  )),
  ip_hash text NULL,
  severity text DEFAULT 'info' CHECK (severity IN ('info','warning','high')),
  metadata jsonb DEFAULT '{}'::jsonb,
  occurred_at timestamptz DEFAULT now()
);

-- ============================================================
-- audit_log (append-only)
-- ============================================================
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NULL REFERENCES public.organizations(id) ON DELETE SET NULL,
  actor_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  occurred_at timestamptz DEFAULT now()
);

-- ============================================================
-- notifications
-- ============================================================
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'team_invite_accepted',
    'password_changed',
    'welcome'
  )),
  title text NOT NULL,
  body text NOT NULL,
  link text NULL,
  read_at timestamptz NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_organization_members_user ON public.organization_members(user_id);
CREATE INDEX idx_organization_members_org ON public.organization_members(org_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_org ON public.user_roles(org_id);
CREATE INDEX idx_org_invitations_org ON public.org_invitations(org_id);
CREATE INDEX idx_org_invitations_email ON public.org_invitations(email);
CREATE INDEX idx_login_attempts_email_time ON public.login_attempts(email_hash, attempted_at DESC);
CREATE INDEX idx_audit_log_org_time ON public.audit_log(org_id, occurred_at DESC);
CREATE INDEX idx_audit_log_actor_time ON public.audit_log(actor_user_id, occurred_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_auth_events_user_time ON public.auth_events(user_id, occurred_at DESC);

-- ============================================================
-- Enable RLS on all 9 tables
-- ============================================================
ALTER TABLE public.profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_invitations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications          ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Realtime: notifications
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

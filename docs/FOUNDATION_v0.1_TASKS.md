# FOUNDATION_v0.1_TASKS.md
> MachIndex Core | Komplett byggplan för v0.1 Foundation

## 1. Syfte och icke-mål

### 1.1 Syfte
Bevisa att en användare kan registrera sig, tillhöra en organisation med strikt multi-tenant isolation, ha en roll, få audit-loggning och realtime notifications. Ren grund att bygga maskinregister på i v0.2.

### 1.2 Icke-mål
Maskinregister, GPS, AI, partner-portaler, service engine, inspektioner, marketplace, billing, offline, blockchain, custody, theft, credit locks. Allt utanför Foundation scope är förbjudet.

---

## 2. Datamodell (9 tabeller)

### 2.1 Enum: app_role

```sql
CREATE TYPE public.app_role AS ENUM ('owner','admin','member','viewer','platform_admin');
```

Inga andra värden. experience_role (machine_owner, service_tech, oem, bank_finance, insurance) lagras på profiles som text, ALDRIG i app_role.

### 2.2 profiles

```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  experience_role text NULL CHECK (experience_role IN ('machine_owner','service_tech','oem','bank_finance','insurance')),
  language text DEFAULT 'sv' CHECK (language IN ('sv','en')),
  onboarding_completed_at timestamptz NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

Regler: Ingen role-kolumn. experience_role ger noll behörighet, styr bara copy/personalisering.

### 2.3 organizations

```sql
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
```

### 2.4 organization_members

```sql
CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(org_id, user_id)
);
```

Regler: Bara membership. Roller lever i user_roles.

### 2.5 user_roles

```sql
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, org_id, role)
);
```

Regler: org_id = NULL enbart för platform_admin. Partner-/experience-roller får aldrig sparas här.

### 2.6 org_invitations

```sql
CREATE TABLE public.org_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role app_role NOT NULL CHECK (role IN ('admin','member','viewer')),
  token_hash text NOT NULL UNIQUE,
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  consumed_at timestamptz NULL,
  consumed_by uuid NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
```

### 2.7 login_attempts

```sql
CREATE TABLE public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash text NOT NULL,
  ip_hash text NOT NULL,
  success boolean NOT NULL,
  attempted_at timestamptz DEFAULT now()
);
```

Regler: Ingen soft delete. Service/RPC write only. Klienter får inte läsa/skriva direkt.

### 2.8 auth_events

```sql
CREATE TABLE public.auth_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  -- Tillåtna: login_success, login_failed, password_reset_requested, password_changed, lockout_triggered, intrusion_detected
  ip_hash text NULL,
  severity text DEFAULT 'info' CHECK (severity IN ('info','warning','high')),
  metadata jsonb DEFAULT '{}',
  occurred_at timestamptz DEFAULT now()
);
```

### 2.9 audit_log

```sql
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NULL REFERENCES organizations(id) ON DELETE SET NULL,
  actor_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  metadata jsonb DEFAULT '{}',
  occurred_at timestamptz DEFAULT now()
);
```

Regler: Append-only. Inga fulla PII-dumpar. Lagra ändrade kolumnnamn och redakterade diffar.

### 2.10 notifications

```sql
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type text NOT NULL,
  -- Tillåtna: team_invite_accepted, password_changed, welcome
  title text NOT NULL,
  body text NOT NULL,
  link text NULL,
  read_at timestamptz NULL,
  created_at timestamptz DEFAULT now()
);
```

---

## 3. RLS-policies

Alla 9 tabeller har RLS enabled. Inga USING(true). Inga breda publika reads. Alla policies använder helper-funktioner där det behövs. Ingen rekursiv RLS.

### 3.1 profiles
- **SELECT:** `user_id = auth.uid() OR public.shares_org_with(auth.uid(), user_id)`
- **INSERT:** `user_id = auth.uid()`
- **UPDATE:** `user_id = auth.uid()`
- **DELETE:** denied

### 3.2 organizations
- **SELECT:** `public.is_org_member(auth.uid(), id)`
- **INSERT:** `auth.uid() IS NOT NULL`
- **UPDATE:** `public.has_org_role(auth.uid(), id, 'owner') OR public.has_org_role(auth.uid(), id, 'admin')`
- **DELETE:** denied

### 3.3 organization_members
- **SELECT:** `public.is_org_member(auth.uid(), org_id)`
- **INSERT:** denied to clients (trigger handles)
- **DELETE:** `public.has_org_role(auth.uid(), org_id, 'owner') OR public.has_org_role(auth.uid(), org_id, 'admin') OR user_id = auth.uid()`

### 3.4 user_roles
- **SELECT:** `user_id = auth.uid() OR public.has_org_role(auth.uid(), org_id, 'owner') OR public.has_org_role(auth.uid(), org_id, 'admin')`
- **INSERT/UPDATE/DELETE:** `public.can_assign_role(auth.uid(), org_id, role)`

### 3.5 org_invitations
- **SELECT:** owner/admin in org
- **INSERT/UPDATE:** same as select
- **DELETE:** denied

### 3.6 login_attempts
- **ALL:** denied to all clients. Writes only via SECURITY DEFINER RPC or service role.

### 3.7 auth_events
- **SELECT:** `user_id = auth.uid() OR public.has_platform_role(auth.uid(), 'platform_admin')`
- **INSERT/UPDATE/DELETE:** denied to clients

### 3.8 audit_log
- **SELECT:** `public.is_org_member(auth.uid(), org_id) AND (public.has_org_role(auth.uid(), org_id, 'owner') OR public.has_org_role(auth.uid(), org_id, 'admin') OR actor_user_id = auth.uid())`
- **INSERT/UPDATE/DELETE:** denied to clients

### 3.9 notifications
- **SELECT:** `user_id = auth.uid()`
- **UPDATE:** `user_id = auth.uid()` (only read_at)
- **INSERT/DELETE:** denied to clients

---

## 4. SECURITY DEFINER-funktioner (5 st)

Alla funktioner: `SECURITY DEFINER`, `SET search_path = public`, `STABLE` (utom RPCs).

### 4.1 has_org_role
```sql
has_org_role(_user uuid, _org uuid, _role app_role) RETURNS boolean
```
Returnerar true om användaren har angiven roll i angiven organisation.

### 4.2 has_platform_role
```sql
has_platform_role(_user uuid, _role app_role) RETURNS boolean
```
Returnerar true om användaren har angiven roll med org_id IS NULL (platform-wide).

### 4.3 is_org_member
```sql
is_org_member(_user uuid, _org uuid) RETURNS boolean
```
Returnerar true om användaren är medlem i angiven organisation (via organization_members).

### 4.4 shares_org_with
```sql
shares_org_with(_a uuid, _b uuid) RETURNS boolean
```
Returnerar true om båda användare delar minst en organisation.

### 4.5 can_assign_role
```sql
can_assign_role(_actor uuid, _org uuid, _role app_role) RETURNS boolean
```

Regler:
- platform_admin kan tilldela allt.
- owner kan tilldela admin/member/viewer och promota till owner.
- Ensam owner kan inte degraderas.
- admin kan tilldela member/viewer men inte owner/admin.
- member/viewer kan inte tilldela något.
- Ingen användare kan ge sig själv en roll de inte redan har.

---

## 5. Triggers

- **handle_new_user():** Vid ny auth.users-rad, skapa profiles-rad.
- **handle_org_creation():** Vid ny organizations-rad, lägg till creator som organization_member + user_role owner.
- **log_audit_event():** Vid INSERT/UPDATE/DELETE på auditable tabeller, skriv till audit_log.
- **touch_updated_at():** Vid UPDATE, sätt updated_at = now().

---

## 6. RPCs

### accept_invitation
```sql
accept_invitation(_token text) RETURNS uuid
```
Hashar token, hittar invitation, verifierar att den inte är expired/consumed, lägger till organization_member + user_role, markerar consumed.

### record_login_attempt
```sql
record_login_attempt(_email text, _ip text, _success boolean) RETURNS void
```
Hashar email och IP, skriver till login_attempts. Kontrollerar lockout-regler (5 misslyckade / 15 min).

---

## 7. Auth-flöde

### 7.1 Signup
Supabase Auth signup med email + password. Email verification required. handle_new_user() trigger skapar profiles-rad.

### 7.2 Login
Supabase Auth signInWithPassword. record_login_attempt RPC vid varje försök. 5 misslyckade / 15 min triggar lockout (auth_events med severity=high).

### 7.3 Password reset
Supabase Auth resetPasswordForEmail + updateUser. Single-use token om Supabase stödjer det.

### 7.4 Session
Idle warning efter 25 min. Auto sign-out efter 30 min.

---

## 8. Onboarding (5 steg)

Route: `/onboarding`

1. **Welcome:** Enkel välkomstskärm. CTA: Kom igång.
2. **Profile:** display_name, valfritt avatar, language.
3. **Organization:** Skapa ny (name, org_number, country) ELLER gå med via invite-token (accept_invitation RPC).
4. **Experience role:** machine_owner / service_tech / oem / bank_finance / insurance. Sparas på profiles.experience_role. Visar: "Detta personaliserar din vy. Det ändrar inte behörigheter."
5. **Done:** Sätt onboarding_completed_at = now(). Redirect till /.

Regler: Email verification krävs innan onboarding. experience_role skapar inga behörigheter. Organization creation trigger lägger till membership + owner role.

---

## 9. Routes

### Public
- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`
- `/verify-email`

### Authenticated (kräver session + completed onboarding)
- `/` (dashboard)
- `/onboarding` (bara när onboarding_completed_at IS NULL)
- `/organization`
- `/team`
- `/account`
- `/audit`
- `/notifications`

### System
- `/403`
- `/404`

### Explicit förbjudna
/machines/\*, /settings, /admin, /portal/\*, /insurance, /finance, /dealer, /workshop, /inspections, /service, /marketplace, sidebar, command palette.

---

## 10. UI-ytor

### 10.1 Dashboard (/)
TopBar: logo, notification bell med unreads, avatar-meny (Account, Sign out). MobileBottomNav (under 768px): Home, Notifications, Account, Sign out. Ingen sidebar.

4-card grid:
1. **Welcome** — hälsning, aktiv org, copy varierar per experience_role
2. **Team** — member count, Invite CTA till /team
3. **Audit** — senaste 5 audit entries, länk till /audit
4. **Coming next** — statisk: "Maskinregistret kommer i v0.2". Ingen CTA.

States: skeleton, empty, error + retry.

### 10.2 Team (/team)
Medlemslista, invite-knapp, roll-dropdown (admin/member/viewer), ta bort medlem. Sole-owner-skydd via DB. Inga tabs, ingen permissions matrix.

### 10.3 Account (/account)
display_name, avatar, change password. Inga tabs, inga sessions/device-listor.

### 10.4 Organization (/organization)
name, org_number, country, logo. Inga tabs, ingen billing/subscription.

### 10.5 Audit (/audit)
Lista audit_log med minimal filtrering: action/type + datumintervall. Inga charts, ingen export.

### 10.6 Notifications (/notifications)
Realtime-prenumeration. Bell badge med olästa. Enkel lista. Mark as read. Inga preferences/toggles.

---

## 11. Notifications-strategi

Server-side inserts via triggers:
- Invite accepted: notifiera inbjudaren
- Password changed: notifiera kontoägaren
- Signup completed: welcome-notification

Realtime via Supabase Realtime channel på notifications-tabellen. Frontend prenumererar med filter `user_id = auth.uid()`.

---

## 12. Audit-strategi

Alla mutationer på auditable tabeller (organizations, organization_members, user_roles, profiles) loggas automatiskt via log_audit_event()-trigger.

Lagrar: action (insert/update/soft_delete), entity_type, entity_id, metadata (ändrade kolumnnamn, redakterade diffar). Append-only. Klienter kan inte skriva/radera. auth_events är separat från audit_log.

---

## 13. Acceptanskriterier

### Steg 1: Schema
- [ ] Alla 9 tabeller har RLS enabled
- [ ] Inga USING(true)
- [ ] app_role enum: exakt 5 värden
- [ ] Alla 5 helper-funktioner existerar med SECURITY DEFINER
- [ ] Två-org-isoleringstest passerar
- [ ] Privilege-eskaleringstest passerar

### Steg 2-3: Auth + Onboarding
- [ ] Email verification krävs innan onboarding
- [ ] Password reset fungerar
- [ ] Login attempts loggas
- [ ] Onboarding skapar org + membership + owner role

### Steg 4-9: UI
- [ ] Skeleton/empty/error states på varje vy
- [ ] Mobil 375px utan horisontell scroll
- [ ] Ingen sidebar, inga tabs, inga /machines/*
- [ ] Notification bell uppdateras via realtime
- [ ] Audit-rader skapas automatiskt av triggers

### Steg 10: Final QA
- [ ] End-to-end: registrera, verifiera mail, logga in, skapa org, bjuda in member, sätta roll, se dashboard, få notis, läsa audit log
- [ ] experience_role läses aldrig i RLS
- [ ] Linter rent
- [ ] 0 edge functions

---

## 14. Out-of-scope (explicit lista)

Machines, GPS, Tramigo, blockchain, BankID, 2FA, OCR, AI, ESG, marketplace, billing, subscription, SMS, webhooks, ownership transfer, partner-portaler, IoT, PWA, offline-sync, inspections, service templates, work orders, custody, theft, credit locks, sidebar, command palette, global search, tabs, settings sections, notification preferences, sessions/device list, role simulation, admin console, document versioning, file viewer.

---

*Genererad 2026-05-11. Baserad på MACHINDEX_CORE_CONTEXT_BUILD_BRIEF.md (27 sektioner), konsoliderad projektanalys av 148 filer från två Lovable-projekt, 51 WTS-servicemallar, 3 säkerhetsaudits och 2 schema-dumpar.*

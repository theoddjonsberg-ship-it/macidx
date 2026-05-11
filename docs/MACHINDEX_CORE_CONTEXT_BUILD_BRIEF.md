# MachIndex Core — Context, Plan & Build Brief för Claude Code

**Syfte:** Detta dokument sammanfattar beslut, kontext, scope, arkitekturprinciper och byggplan för att skapa en ny, renodlad greenfield-version av MachIndex Core. Dokumentet är avsett att kunna ges till Claude Code som styrande context inför implementation.

**Status:** Gammalt repo är fryst som read-only legacy. Ny version ska byggas som greenfield Core med ny backend/cloud-instans. Ingen automatisk migration från gamla projektet.

---

## 1. Bakgrund och nuläge

MachIndex har vuxit fram genom flera experimentella projektversioner med många parallella moduler: maskinregister, försäkring, finans, dealer, workshop, custody, marketplace, ESG, AI, GPS, stöld, krisberedskap, workflows, notifications, dokument, ägande, service och olika dashboards.

En tidigare audit visade ungefärlig omfattning:

- 86 sidor/routes
- 285 komponenter
- 155 publika tabeller
- 430 RLS-policies
- 35 edge functions
- 25 app-roller
- Många experimentella moduler och överlappande datamodeller

Slutsatsen var att projektet inte ska "städas lite" i samma kodbas. Det ska byggas om som en ny ren version: **MachIndex Core**.

Den gamla kodbasen/repot, inklusive machindexversiontwo, ska betraktas som **legacy reference**. Den får användas för att läsa, jämföra och manuellt hämta inspiration, men inte som aktiv produktbas.

---

## 2. Låsta beslut

### 2.1 Repo-strategi

**Beslut:** machindexversiontwo sätts read-only i 30 dagar.

Regler:

- Ingen ny utveckling.
- Inga nya features.
- Inga schemaändringar.
- Inga designändringar.
- Inga nya routes.
- Inga refactors.
- Inga dokumentationsändringar om de inte uttryckligen behövs utanför Core.
- Repot används endast som historisk referens.

Efter 30 dagar arkiveras det, om det inte finns dokumenterad anledning att behålla det som referens.

### 2.2 Backend-strategi

**Beslut:** Ny Supabase-instans (eu-north-1).

Den nya Core-versionen ska inte dela backend med gamla projektet.

Regler:

- Ny databas.
- Nytt schema.
- Nya genererade types.
- Nya RLS-policies.
- Nya edge functions endast om absolut nödvändigt.
- Ingen import av gamla types.ts.
- Ingen automatisk migration av gamla tabeller.
- Ingen återanvändning av gamla RLS-policies.
- Ingen återanvändning av gamla edge functions.
- Endast selektiv manuell migrering av godkända Core-koncept.

### 2.3 Domänstrategi

**Beslut:** machindex.eu och machinetag.eu pekas om först vid v0.3.

Fram till dess:

- Nya Core använder temporär hosting-URL.
- Gamla publika länkar behöver inte skyddas (inga aktiva externa användare).
- Inga nya fysiska QR/NFC-taggar ska genereras från gamla projektet.
- Domänflytt sker först när QR + Machinetag public verification fungerar i nya Core.

### 2.4 Park/Remove-strategi

**Beslut:** Park/Remove-listan fryses nu.

Regler:

- Implementera inte Park/Remove i Core.
- Exponera inte i navigation.
- Skapa inte placeholder-routes.
- Skapa inte hidden UI för dessa moduler.
- Migrera inte tabeller, edge functions eller generated types för dessa moduler.
- Om en parkerad funktion ska återöppnas krävs explicit affärsmotivering efter Core v0.3.

---

## 3. Produktprincip

MachIndex Core ska vara en smal, robust och verifierbar produkt kring maskinidentitet och organisatorisk grundstruktur.

Den gamla produkten försökte vara för mycket samtidigt. Den nya Core ska först bevisa:

1. En användare kan skapa konto, verifiera e-post, logga in och slutföra onboarding.
2. En användare tillhör en organisation.
3. Organisationer är strikt isolerade via RLS.
4. En minimal rollmodell fungerar.
5. Audit och notifications fungerar.
6. Grunden är ren nog att bygga maskinregister på i v0.2.

**Core v0.1 ska inte innehålla maskinregister ännu.**

---

## 4. Övergripande roadmap

### Core v0.1 — Foundation
Auth, organization, profile, minimal role model, onboarding, dashboard shell, team, account, organization settings, audit, notifications, design tokens, RLS baseline. Ingen machine registry.

### Core v0.2 — Machine Registry
Machines, add machine, machine list, machine profile, basic machine specs, basic documents, basic machine status. No advanced GPS/AI/finance/insurance.

### Core v0.2.5 — Compliance Requirements
Kontroller och krav vid registrering. Senaste utförd kontroll, nästa förfallodatum, warning dates, dokument/protokoll, regelmallar.

### Core v0.3 — QR / Machinetag / Public Verification
QR generation, public tag route, public-safe machine verification, existing tag redirect strategy, domain cutover readiness.

### Core v0.4 och framåt
Export, GDPR, reminders, global search, contracts, Proof-of-Asset, PWA/offline, templates.

### Protection v1.x
GPS/Tramigo, geofence alerts, theft suite, credit locks/lien, partner-risk views.

### Partner View / API
Insurance card, finance card, webhooks, partner API.

---

## 5. Vad Core INTE är i v0.1

Följande får inte byggas, inte routas, inte skapas som placeholder och inte migreras:

Maskinregister, /machines/*, GPS, Tramigo, blockchain, BankID, 2FA, OCR, AI, ESG, marketplace, billing, subscriptions, ownership transfer, contracts, signatures, inspections, service templates, work orders, fault reports, custody, theft reporting, credit locks, finance portal, insurance portal, dealer portal, workshop portal, partner portals, IoT, webhooks, public API, PWA, offline sync, IndexedDB cache, document versioning, file viewer, SuperAdmin role switcher, role simulation, settings tabs, account sessions, device cards, notification preferences, permissions matrix, command palette, global search, sidebar, navigation overlay.

---

## 6. MachIndex Core v0.1 — Styrande scope

### 6.1 Scope summary

Core v0.1 ska bevisa fyra saker:

1. En riktig användare kan registrera sig, verifiera e-post, logga in och återställa lösenord.
2. En användare tillhör en organisation med strikt multi-tenant isolation.
3. En minimal rollmodell (owner, admin, member, viewer, platform_admin) fungerar via RLS och SECURITY DEFINER helpers utan rekursiva RLS-problem.
4. Alla relevanta mutationer audit-loggas och användare kan få realtime notifications.

UI ska vara minimalt: en route per koncept, en form per koncept. Inga tabs, inga preference panels, inga admin consoles, inga sessions/devices, ingen permissions matrix, inga framtida moduler.

Datamodellen och RLS ska däremot vara korrekt från dag ett.

---

## 7. Routes v0.1

### Public routes
- /login
- /signup
- /forgot-password
- /reset-password
- /verify-email

### Authenticated routes (kräver aktiv session + completed onboarding)
- /onboarding (endast när profiles.onboarding_completed_at IS NULL)
- / (dashboard shell)
- /organization
- /team
- /account
- /audit
- /notifications

### System routes
- /403
- /404

### Explicitly forbidden routes
/account/sessions, /timeline, /settings, /admin, /machines/*, /portal/*, /insurance, /finance, /dealer, /workshop, /inspections, /service, /marketplace, sidebar-based navigation.

---

## 8. Database v0.1

v0.1 ska ha exakt 9 tabeller, 1 enum, RLS på alla tabeller, inga andra tabeller.

### 8.1 Enum: app_role
owner, admin, member, viewer, platform_admin.

### 8.2 profiles
user_id, display_name, avatar_url, experience_role (text, NULL), language, onboarding_completed_at, created_at, updated_at.

### 8.3 organizations
id, name, org_number, country, logo_url, timezone, created_at, updated_at.

### 8.4 organization_members
id, org_id, user_id, joined_at. UNIQUE(org_id, user_id).

### 8.5 user_roles
id, user_id, org_id (NULL for platform_admin), role app_role, created_at. UNIQUE(user_id, org_id, role).

### 8.6 org_invitations
id, org_id, email, role, token_hash, invited_by, expires_at, consumed_at, consumed_by, created_at.

### 8.7 login_attempts
id, email_hash, ip_hash, success, attempted_at. Service/RPC write only.

### 8.8 auth_events
id, user_id, event_type, ip_hash, severity, metadata, occurred_at.

### 8.9 audit_log
id, org_id, actor_user_id, action, entity_type, entity_id, metadata, occurred_at. Append-only.

### 8.10 notifications
id, user_id, org_id, type, title, body, link, read_at, created_at.

---

## 9. RLS policies v0.1

All 9 tables must have RLS enabled. No USING(true). No broad public reads. Every policy uses helper functions where needed. No recursive RLS.

### profiles
- SELECT: user_id = auth.uid() OR shares_org_with(auth.uid(), user_id)
- INSERT: user_id = auth.uid()
- UPDATE: user_id = auth.uid()
- DELETE: denied

### organizations
- SELECT: is_org_member(auth.uid(), id)
- INSERT: auth.uid() IS NOT NULL
- UPDATE: has_org_role(auth.uid(), id, 'owner') OR has_org_role(auth.uid(), id, 'admin')
- DELETE: denied

### organization_members
- SELECT: is_org_member(auth.uid(), org_id)
- INSERT: denied to clients
- DELETE: has_org_role owner/admin OR user_id = auth.uid()

### user_roles
- SELECT: user_id = auth.uid() OR has_org_role owner/admin
- INSERT/UPDATE/DELETE: can_assign_role(auth.uid(), org_id, role)

### org_invitations
- SELECT/INSERT/UPDATE: owner/admin in org
- DELETE: denied

### login_attempts
- ALL: denied to all clients

### auth_events
- SELECT: user_id = auth.uid() OR has_platform_role platform_admin
- INSERT/UPDATE/DELETE: denied

### audit_log
- SELECT: is_org_member AND (has_org_role owner/admin OR actor_user_id = auth.uid())
- INSERT/UPDATE/DELETE: denied

### notifications
- SELECT: user_id = auth.uid()
- UPDATE: user_id = auth.uid() (only read_at)
- INSERT/DELETE: denied

---

## 10. SECURITY DEFINER helper functions

```sql
has_org_role(_user uuid, _org uuid, _role app_role) returns boolean
has_platform_role(_user uuid, _role app_role) returns boolean
is_org_member(_user uuid, _org uuid) returns boolean
shares_org_with(_a uuid, _b uuid) returns boolean
can_assign_role(_actor uuid, _org uuid, _role app_role) returns boolean
```

### can_assign_role rules
- platform_admin can assign anything.
- owner can assign admin, member, viewer. Owner can promote another member to owner.
- Sole owner cannot demote/remove self.
- admin can assign member, viewer. Cannot assign owner or admin.
- member and viewer can assign nothing.
- No user can grant themselves a role they do not already hold.

### Triggers
- handle_new_user()
- handle_org_creation()
- log_audit_event()
- touch_updated_at()

### RPCs
- accept_invitation(_token text) returns uuid
- record_login_attempt(_email text, _ip text, _success boolean) returns void

---

## 11. Onboarding v0.1

Route: /onboarding. Five steps:

1. Welcome — CTA: Get started
2. Profile — display_name, avatar_url, language
3. Organization — Create new OR join with invitation token
4. Experience role — machine_owner/service_tech/oem/bank_finance/insurance (saves to profiles.experience_role, no permissions)
5. Done — set onboarding_completed_at = now(), redirect to /

Email verification required before onboarding.

---

## 12. Dashboard v0.1

Route: /

TopBar: logo, notification bell, avatar menu (Account, Sign out).
MobileBottomNav (below 768px): Home, Notifications, Account, Sign out.
No sidebar. No navigation overlay. No command palette.

4-card grid:
1. Welcome — greeting, active org name
2. Team — member count, invite CTA
3. Audit — last five entries
4. Coming next — static: "Maskinregistret kommer i v0.2"

States: skeleton, empty, error + retry.

---

## 13-17. Team, Account, Organization, Audit, Notifications

Each is a single page, no tabs, minimal scope as specified in FOUNDATION_v0.1_TASKS.md sections 10.2-10.6.

---

## 18. Edge functions

Target for v0.1: **zero edge functions**.

If an edge function is proposed, Claude Code must explain: (1) why RPC + RLS cannot solve it, (2) what data it reads/writes, (3) how it authenticates, (4) why it belongs in v0.1.

---

## 19. Auth and session scope

- Supabase default auth (signup, email verification, login, forgot/reset password, change password)
- Idle timeout: warning 25 min, sign out 30 min
- Login attempt tracking via RPC
- 5 failed logins / 15 min triggers lockout
- No sessions table, device table, MFA, BankID, custom auth provider

---

## 20. Design system v0.1

MachIndex Design System v2.2. Light mode default, dark mode opt-in.

- Semantic tokens only, no hardcoded hex
- No shadows, glow, blur, gradients
- No emojis in UI
- Skeletons before spinners
- Lucide icons, consistent stroke
- 44px minimum touch targets
- Mobile-first, 375px no horizontal scroll
- Visible focus rings
- Primary color: grön (#4aba5a) i linje med webbplats och varumärke

---

## 21. Implementation order for Claude Code

1. **Step 1 — Schema + RLS + helpers.** Stop and report.
2. Step 2 — Auth pages
3. Step 3 — Onboarding
4. Step 4 — Dashboard shell
5. Step 5 — Team
6. Step 6 — Account
7. Step 7 — Organization
8. Step 8 — Audit
9. Step 9 — Notifications
10. Step 10 — Final QA

---

## 22. QA checklist

### Datamodel + security
- All 9 tables have RLS enabled
- No USING(true)
- No role column on profiles
- app_role enum: exactly 5 values
- All five helper functions exist with SECURITY DEFINER
- Two-org isolation test passes
- Privilege escalation test passes

### Auth
- Email verification required before onboarding
- Password reset works
- Idle warning at 25 min, sign-out at 30 min
- Login attempts logged

### UX
- Skeleton/empty/error states exist
- Mobile 375px no horizontal scroll
- No sidebar, no tabs, no /machines/*
- Accessible focus rings

### Design
- No emojis, no hardcoded hex, no shadows, no blur, no gradients
- Semantic tokens only

### Audit + notifications
- Mutations produce audit rows via triggers
- Notification bell updates through realtime

---

## 23-24. Future features (compliance, machine registry)

Not v0.1. Documented for context only. See CORE_ROADMAP.md.

---

## 25. Instructions to Claude Code

### Must do
- Build greenfield Core
- Use new Supabase instance
- Implement only v0.1 Foundation
- Stop after Step 1 and report
- Keep implementation thin but correct
- Prioritize RLS correctness before UI
- Use semantic design tokens
- Document deviations

### Must not do
- Do not import old repo
- Do not reuse old backend
- Do not recreate old feature breadth
- Do not create future modules
- Do not add edge functions unless justified
- Do not create machine registry yet
- Do not add tabs, sidebar, command palette

---

## 26. First command to Claude Code

```
Read CLAUDE.md.
Implement Step 1: Schema + RLS + helper functions + triggers + RPCs for Core v0.1 Foundation.
Do not implement UI yet. Do not create routes yet. Do not create edge functions.
After Step 1, stop and report:
1. Created enum values
2. Created tables
3. Created helper functions
4. Created triggers
5. Created RPCs
6. Created RLS policies
7. Any deviations from the brief
8. Whether linter is clean
9. Two-org isolation test result
10. Privilege escalation test result
```

---

## 27. Final strategic summary

MachIndex Core is not a smaller UI version of the old product. It is a new controlled foundation.

The new pattern is: correct foundation, trusted data model, strict isolation, simple UX, expand only after gates.

v0.1 succeeds if it is boring, secure and clean. It fails if it starts looking impressive but reintroduces old complexity.

Build less. Build correctly.

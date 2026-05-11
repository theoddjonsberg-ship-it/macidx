# CLAUDE.md
> Styrfil for Claude Code | MachIndex Core v0.1 Foundation

## 1. Projekt

MachIndex Core är en greenfield-omstart av en B2B-plattform för maskinidentitet. Detta är v0.1 Foundation: auth, org, team, audit, notifications. Inget maskinregister. Ingen AI. Inga partner-portaler.

**Styrande dokument:** `docs/MACHINDEX_CORE_CONTEXT_BUILD_BRIEF.md` (27 sektioner). Läs den först. Den är lag.

## 2. Stack

- React 18 + Vite 5 + TypeScript 5 + Tailwind v3 + shadcn/ui
- react-router-dom v6, TanStack Query, Zod, react-hook-form
- Supabase (ny instans, eu-north-1) för auth, DB, storage
- Supabase default SMTP för auth-mail i v0.1
- GitHub är canonical source. Nytt tomt repo.
- Pure Leaflet via refs (aldrig react-leaflet) om kartor behövs senare
- Lucide-ikoner stroke 1.75, ingen emoji i UI

## 3. Kommandon

```bash
npm run dev          # lokal dev-server
npm run build        # produktionsbuild
npm run lint         # ESLint
npx supabase db push # kör migrationer mot Supabase
npx supabase gen types typescript --project-id <ID> > src/types/database.ts
```

## 4. Katalogstruktur

```
src/
  components/        # UI-komponenter per domän
  hooks/             # Custom hooks (useAuth, useOrg, etc.)
  lib/               # supabase.ts, utils
  pages/             # En fil per route
  types/             # database.ts (genererad), app-typer
supabase/
  migrations/        # SQL-filer, kronologiskt
  config.toml
docs/
  MACHINDEX_CORE_CONTEXT_BUILD_BRIEF.md
  FOUNDATION_v0.1_TASKS.md
  PROJECT_CONTEXT.md
```

## 5. Säkerhetsregler (icke-förhandlingsbara)

- RLS på alla tabeller. Aldrig USING(true). Multi-tenant via org_id.
- Roller i separat user_roles-tabell med app_role enum. Aldrig roller på profiles.
- SECURITY DEFINER-funktioner för org-lookups. Ingen RLS-rekursion.
- Soft delete via deleted_at. Audit-log via triggers (ej manuellt i kod).
- Inga credentials i kod, prompts eller specifikationer.
- Aldrig `new Function()`. Använd egen evalMathExpr om formler behövs.
- Views: `security_invoker = on`.

## 6. Scope v0.1 (BARA detta)

- Auth: login, signup, email verification, password reset, lockout
- Onboarding: 5-stegs wizard (welcome, profile, org, experience role, done)
- Dashboard: 4-card grid (welcome, team, audit, coming next)
- Team: member list, invite, role change, remove
- Account: display_name, avatar, change password
- Organization: name, org_number, country, logo
- Audit: append-only log med type/date filter
- Notifications: realtime, bell badge, mark as read

## 7. Explicit förbjudet i v0.1

Bygg INTE: machines, GPS, Tramigo, blockchain, BankID, 2FA, OCR, AI, ESG, marketplace, billing, subscription, SMS, webhooks, ownership transfer, partner-portaler, IoT, PWA, offline-sync, inspections, service templates, work orders, custody, theft, credit locks, sidebar, command palette, global search, tabs, settings sections, notification preferences, sessions/device list, role simulation, admin console.

## 8. Datamodell (9 tabeller)

- `profiles` (user_id, display_name, avatar_url, experience_role, language, onboarding_completed_at)
- `organizations` (name, org_number, country, logo_url, timezone)
- `organization_members` (org_id, user_id, joined_at)
- `user_roles` (user_id, org_id, role app_role)
- `org_invitations` (org_id, email, role, token_hash, invited_by, expires_at, consumed_at)
- `login_attempts` (email_hash, ip_hash, success, attempted_at)
- `auth_events` (user_id, event_type, ip_hash, severity, metadata, occurred_at)
- `audit_log` (org_id, actor_user_id, action, entity_type, entity_id, metadata, occurred_at)
- `notifications` (user_id, org_id, type, title, body, link, read_at)

## 9. Helper-funktioner (5 st, SECURITY DEFINER)

```sql
has_org_role(_user uuid, _org uuid, _role app_role) returns boolean
has_platform_role(_user uuid, _role app_role) returns boolean
is_org_member(_user uuid, _org uuid) returns boolean
shares_org_with(_a uuid, _b uuid) returns boolean
can_assign_role(_actor uuid, _org uuid, _role app_role) returns boolean
```

## 10. Byggordning

1. **Steg 1: Schema + RLS + helpers + triggers + RPCs.** STOPPA och rapportera.
2. Steg 2: Auth-sidor (/login, /signup, /forgot-password, /reset-password, /verify-email).
3. Steg 3: Onboarding (/onboarding, 5 steg).
4. Steg 4: Dashboard-skal (/, TopBar, MobileBottomNav, 4 cards).
5. Steg 5: Team (/team).
6. Steg 6: Account (/account).
7. Steg 7: Organization (/organization).
8. Steg 8: Audit (/audit).
9. Steg 9: Notifications (/notifications, realtime, bell badge).
10. Steg 10: Final QA + rapport.

## 11. Edge functions

**Mål: Noll edge functions i v0.1.** Om en edge function föreslås, ange: (1) varför RPC + RLS inte räcker, (2) vilken data den läser/skriver, (3) hur den autentiserar, (4) varför den tillhör v0.1.

## 12. Design

- Light mode default. Dark mode opt-in.
- Semantiska tokens, aldrig hårdkodade hex.
- Inga shadows, glow, blur, gradients.
- Inga emojis i UI.
- Skeletons > spinners.
- 44px minimum touch targets.
- Mobile-first, 375px utan horisontell scroll.
- Synliga focus rings.
- Primary color: grön (#4aba5a) i linje med webbplats och varumärke.

## 13. QA-checklista (varje steg)

- [ ] Alla tabeller har RLS, inga USING(true)
- [ ] Två-org-isoleringstest passerar
- [ ] Admin kan inte skapa owner-roll
- [ ] Member kan inte ändra någons roll
- [ ] Sole owner kan inte tas bort
- [ ] experience_role påverkar inte RLS
- [ ] Skeleton/empty/error states på varje vy
- [ ] Mobil 375px utan horisontell scroll
- [ ] Ingen sidebar, inga tabs, inga /machines/*

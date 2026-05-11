# PROJECT_CONTEXT.md
> MachIndex Core | Greenfield Projektkontext

## 1. Vad detta projekt är

MachIndex Core är en greenfield-omstart av en B2B-plattform för maskinidentitet, ägande och evidens. Plattformen ska göra det möjligt för maskinägare, serviceorganisationer, finansbolag och försäkringsbolag att verifiera vem som äger en maskin, dess historik, dokumentation och status.

Detta är INTE en port av en befintlig kodbas. Två gamla Lovable-projekt (Projekt A: 143 tabeller, Projekt B: 59 tabeller) är frysta som read-only referens i 30 dagar. Inget kopieras automatiskt.

## 2. Varför greenfield

- **Projekt A:** 143 tabeller, 625 RLS-policies, org-baserad arkitektur men extremt bred yta (custody, crisis, dealer, marketplace, ESG, blockchain, workflows).
- **Projekt B:** 59 tabeller, 79 RLS-policies baserade på `owner_id` (user-baserad, ej org-baserad). Bryter multi-tenant-principen.
- **28 tabeller** överlappar med olika kolumnstruktur. Kan inte slås ihop.
- **Noll produktionsdata:** organizations=0, user_roles=0, profiles=0, audit_log=0. Ingen datamigrering behövs.
- **Inga externa användare.** Ingen pilotkund använder nuvarande system aktivt.
- **Enda värdefull data:** taxonomy_brands (1885 rader), machine_specs (125 rader). Exporteras som SQL INSERT vid behov i v0.2.

## 3. Låsta beslut

### 3.1 Repo
Gamla repon (machindexversiontwo + Core) är read-only i 30 dagar, sedan arkiveras de. Ny version byggs i nytt tomt GitHub-repo. GitHub är canonical source.

### 3.2 Backend
Ny Supabase-instans (eu-north-1). Helt rent schema. Inga gamla types, RLS-policies eller edge functions återanvänds.

### 3.3 Domäner
machindex.eu och machinetag.eu pekas om först vid v0.3 när QR + public verification fungerar. Fram till dess används temporär hosting-URL. Inga gamla QR-länkar behöver skyddas (inga aktiva externa användare).

### 3.4 Park/Remove
Frusen lista. Implementera inte, exponera inte, skapa inga placeholder-routes. Om en parkerad funktion ska återöppnas krävs explicit affärsmotivering efter Core v0.3.

## 4. Stack

| Lager | Val |
|-------|-----|
| Frontend | React 18, Vite 5, TypeScript 5, Tailwind v3, shadcn/ui |
| State | TanStack Query, React Context |
| Routing | react-router-dom v6 |
| Validering | Zod + react-hook-form |
| Backend | Supabase (ny instans, eu-north-1): Postgres, Auth, Storage, Realtime |
| Auth-mail | Supabase default SMTP i v0.1 |
| Hosting | Temporär hosting-URL. GitHub canonical. Vercel/Cloudflare utvärderas efter v0.1 |
| AI | Ingen i v0.1. Parkerad till v0.5+ |
| CI/CD | Manuellt i v0.1. GitHub Actions efter v0.1 |
| Test | Vitest (unit) + Playwright (E2E) när stabilt |

## 5. Roadmap

| Version | Fokus | Status |
|---------|-------|--------|
| **v0.1** | Foundation: auth, org, team, audit, notifications | **NU** |
| v0.2 | Machine Registry: list, profile, specs, dokument, add-flow | Nästa |
| v0.2.5 | Compliance: regelmotor för obligatoriska kontroller | Planerad |
| v0.3 | QR, Machinetag, public verification, domänflytt | Planerad |
| v0.4-v0.8 | Export, GDPR, reminders, search, contracts, PWA, templates | Framtid |
| v1.x | GPS/Tramigo, geofence, theft, credit locks | Framtid |
| Partner | Finance/insurance views, public API, webhooks | Framtid |

## 6. Scope v0.1 Foundation

Core v0.1 ska bevisa fyra saker:

1. En riktig användare kan registrera sig, verifiera e-post, logga in och återställa lösenord.
2. En användare tillhör en organisation med strikt multi-tenant isolation.
3. En minimal rollmodell (owner, admin, member, viewer, platform_admin) fungerar via RLS och SECURITY DEFINER helpers.
4. Alla relevanta mutationer audit-loggas och användare kan få realtime notifications.

### 9 tabeller
profiles, organizations, organization_members, user_roles, org_invitations, login_attempts, auth_events, audit_log, notifications

### 1 enum
app_role: owner, admin, member, viewer, platform_admin

### 5 helpers (SECURITY DEFINER)
has_org_role, has_platform_role, is_org_member, shares_org_with, can_assign_role

### Routes
**Public:** /login, /signup, /forgot-password, /reset-password, /verify-email
**Authenticated:** /, /onboarding, /organization, /team, /account, /audit, /notifications
**System:** /403, /404

### 0 edge functions
Mål: noll. Om en föreslås krävs skriftlig motivering.

## 7. Explicit exkluderat från v0.1

Maskiner, GPS, Tramigo, blockchain, BankID, 2FA, OCR, AI, ESG, marketplace, billing, subscription, ownership transfer, contracts, signatures, inspections, service templates, work orders, custody, theft, credit locks, finance portal, insurance portal, dealer portal, workshop portal, IoT, webhooks, public API, PWA, offline sync, document versioning, sidebar, command palette, global search, tabs, settings sections, notification preferences, sessions/device list, role simulation.

## 8. Designsystem

MachIndex Design System v2.2. Light mode default, dark mode opt-in. Semantiska tokens, inga hårdkodade hex. Inga shadows, glow, blur, gradients, emojis. Skeletons före spinners. 44px touch targets. Mobile-first (375px). Synliga focus rings. Typografi: Geist (UI) + JetBrains Mono (data/kod).

**Primary color:** Grön (#4aba5a) i linje med webbplats och varumärke.

## 9. Säkerhetsprinciper

- RLS på allt, aldrig USING(true). Multi-tenant via org_id.
- Roller i separat tabell med app_role enum.
- SECURITY DEFINER för org-lookups.
- Soft delete via deleted_at.
- Audit-log via triggers.
- Edge functions kräver session-token.
- Storage-paths: {org_id}/{timestamp}_{filename}.
- Inga credentials i kod.

## 10. Legacy-referens

Två gamla Lovable-projekt är tillgängliga som read-only referens i 30 dagar. De innehåller värden att konsultera men inte kopiera:

- **Projekt A:** app_role enum, has_role/is_org_member helpers, org-baserad RLS-arkitektur
- **Projekt B:** trust score triggers, service engine spec, WTS-mallar (51 st)
- **Seed-data:** taxonomy_brands (1885 rader), machine_specs (125 rader)

Använd schemat som negativ referens: bevis på varför greenfield krävs, inte mall för migrering.

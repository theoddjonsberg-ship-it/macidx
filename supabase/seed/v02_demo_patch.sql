-- =============================================================================
-- v02_demo_patch.sql — Komplettera demo-data till Q2-demo-nivå
-- =============================================================================
-- Kör EFTER v02_demo_data.sql
-- Skapar: ~30 maskiner med varierad MII, 3 scenarier, 9 fler consents
-- =============================================================================

BEGIN;

-- =============================================================================
-- Step 1: Disable recalc triggers (manuella MII-värden ska inte överskrivas)
-- =============================================================================
ALTER TABLE public.machines DISABLE TRIGGER IF EXISTS trg_machines_recalc;
ALTER TABLE public.machine_events DISABLE TRIGGER IF EXISTS trg_machine_events_recalc;
ALTER TABLE public.documents DISABLE TRIGGER IF EXISTS trg_documents_recalc;
-- These may not exist yet
DO $$ BEGIN
  ALTER TABLE public.machine_verifications DISABLE TRIGGER trg_machine_verifications_recalc;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- =============================================================================
-- Step 2: Lägg till saknade orgs
-- =============================================================================
INSERT INTO public.organizations (id, name, org_number, country, org_type, contact_person, contact_email, timezone) VALUES
  ('aaaa0006-0000-0000-0000-000000000001', 'Peab Anlaggning AB [DEMO]', '556099-9009', 'SE', 'machine_owner', 'Linda Karlsson', 'demo+peab@machindex.com', 'Europe/Stockholm'),
  ('bbbb0002-0000-0000-0000-000000000001', 'SEB Leasing AB [DEMO]', '556032-9081', 'SE', 'finance', 'Johan Soderberg', 'demo+seb@machindex.com', 'Europe/Stockholm'),
  ('bbbb0003-0000-0000-0000-000000000001', 'Handelsbanken Finans [DEMO]', '556053-0653', 'SE', 'finance', 'Per Andersson', 'demo+shb@machindex.com', 'Europe/Stockholm'),
  ('cccc0002-0000-0000-0000-000000000001', 'Lansforsakringar Maskin [DEMO]', '502010-9681', 'SE', 'insurance', 'Sara Nilsson', 'demo+lf@machindex.com', 'Europe/Stockholm'),
  ('cccc0003-0000-0000-0000-000000000001', 'Gjensidige Sverige [DEMO]', '516406-9095', 'SE', 'insurance', 'Hanna Berg', 'demo+gjen@machindex.com', 'Europe/Stockholm'),
  ('dddd0001-0000-0000-0000-000000000001', 'Volvo Financial Services [DEMO]', '556069-0967', 'SE', 'leasing', 'Lars Johansson', 'demo+vfs@machindex.com', 'Europe/Stockholm'),
  ('dddd0002-0000-0000-0000-000000000001', 'Wacker Neuson Finance [DEMO]', '556712-1234', 'SE', 'leasing', 'Anders Wolff', 'demo+wn@machindex.com', 'Europe/Stockholm'),
  ('eeee0002-0000-0000-0000-000000000001', 'Hesselberg Maskin AB [DEMO]', '556511-9988', 'SE', 'service_partner', 'Ulrika Hesselberg', 'demo+hes@machindex.com', 'Europe/Stockholm')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Step 3: Lägg till ~30 maskiner med varierad MII
-- Fördelning: 8 L1, 10 L2, 8 L3, 4 L4
-- =============================================================================

-- === L1 MACHINES (8 st) - Grundläggande identitet, inga dokument ===
INSERT INTO public.machines
  (id, org_id, name, brand, model, serial_number, year, type, operating_hours, status, mii_level, trust_score, trust_breakdown)
VALUES
  (gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000001', 'Volvo L70H #1', 'Volvo', 'L70H', 'VCL70H2019001', 2019, 'wheel_loader', 4200, 'active', 'L1', 33,
   '{"identity":23,"documents":0,"verification":6,"history":4,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb),
  (gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000001', 'CAT 950M #1', 'Caterpillar', '950M', 'CAT950M2020001', 2020, 'wheel_loader', 3100, 'active', 'L1', 35,
   '{"identity":24,"documents":0,"verification":6,"history":5,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb),
  (gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000001', 'Doosan DX140LC', 'Doosan', 'DX140LC-5', 'DX140LC2018001', 2018, 'excavator', 5800, 'active', 'L1', 31,
   '{"identity":22,"documents":0,"verification":6,"history":3,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb),
  (gen_random_uuid(), 'aaaa0002-0000-0000-0000-000000000001', 'Hitachi ZX210LC', 'Hitachi', 'ZX210LC-6', 'HTZX2102019001', 2019, 'excavator', 4500, 'active', 'L1', 34,
   '{"identity":23,"documents":0,"verification":6,"history":5,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb),
  (gen_random_uuid(), 'aaaa0002-0000-0000-0000-000000000001', 'JCB 437 HT', 'JCB', '437 HT', 'JCB437HT2020001', 2020, 'wheel_loader', 2900, 'active', 'L1', 32,
   '{"identity":22,"documents":0,"verification":6,"history":4,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb),
  (gen_random_uuid(), 'aaaa0002-0000-0000-0000-000000000001', 'Bobcat S570', 'Bobcat', 'S570', 'BCTS5702021001', 2021, 'compact', 1800, 'active', 'L1', 35,
   '{"identity":24,"documents":0,"verification":6,"history":5,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb),
  (gen_random_uuid(), 'aaaa0006-0000-0000-0000-000000000001', 'Liebherr R920', 'Liebherr', 'R920', 'LBHR9202018001', 2018, 'excavator', 6200, 'active', 'L1', 30,
   '{"identity":22,"documents":0,"verification":6,"history":2,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb),
  (gen_random_uuid(), 'aaaa0006-0000-0000-0000-000000000001', 'Toyota 8FG25', 'Toyota', '8FG25', 'TOY8FG252020001', 2020, 'forklift', 3400, 'active', 'L1', 33,
   '{"identity":23,"documents":0,"verification":6,"history":4,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- === L2 MACHINES (10 st) - Har dokument, saknar verifiering ===
INSERT INTO public.machines
  (id, org_id, name, brand, model, serial_number, year, type, operating_hours, status, mii_level, trust_score, latitude, longitude, last_gps_update, trust_breakdown)
VALUES
  (gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000001', 'Volvo EC300E', 'Volvo', 'EC300E', 'VCEC300E2021001', 2021, 'excavator', 2100, 'active', 'L2', 47,
   59.3250, 18.0710, now() - interval '2 hours',
   '{"identity":24,"documents":12,"verification":6,"history":5,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb),
  (gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000001', 'Komatsu PC290LC', 'Komatsu', 'PC290LC-11', 'KMTPC2902020001', 2020, 'excavator', 3500, 'active', 'L2', 52,
   59.3280, 18.0650, now() - interval '45 minutes',
   '{"identity":25,"documents":14,"verification":6,"history":7,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb),
  (gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000001', 'Volvo L120H', 'Volvo', 'L120H', 'VCL120H2022001', 2022, 'wheel_loader', 1200, 'active', 'L2', 55,
   59.3310, 18.0580, now() - interval '15 minutes',
   '{"identity":25,"documents":15,"verification":6,"history":9,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb),
  (gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000001', 'Manitou MT1840', 'Manitou', 'MT1840', 'MNTMT18402021001', 2021, 'telehandler', 1800, 'active', 'L2', 49,
   NULL, NULL, NULL,
   '{"identity":24,"documents":13,"verification":6,"history":6,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb),
  (gen_random_uuid(), 'aaaa0002-0000-0000-0000-000000000001', 'CAT 320 GC', 'Caterpillar', '320 GC', 'CAT320GC2022001', 2022, 'excavator', 980, 'active', 'L2', 58,
   57.7050, 11.9680, now() - interval '30 minutes',
   '{"identity":25,"documents":15,"verification":6,"history":12,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb),
  (gen_random_uuid(), 'aaaa0002-0000-0000-0000-000000000001', 'Volvo A30G', 'Volvo', 'A30G', 'VCA30G2020001', 2020, 'dumper', 4100, 'active', 'L2', 50,
   57.7020, 11.9720, now() - interval '1 hour',
   '{"identity":24,"documents":14,"verification":6,"history":6,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb),
  (gen_random_uuid(), 'aaaa0002-0000-0000-0000-000000000001', 'Hangcha CPCD50', 'Hangcha', 'CPCD50', 'HCCPCD502021001', 2021, 'forklift', 2200, 'active', 'L2', 46,
   NULL, NULL, NULL,
   '{"identity":24,"documents":10,"verification":6,"history":6,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb),
  (gen_random_uuid(), 'aaaa0006-0000-0000-0000-000000000001', 'Volvo EC220E #2', 'Volvo', 'EC220E', 'VCEC220E2022002', 2022, 'excavator', 1400, 'active', 'L2', 53,
   57.6980, 11.9750, now() - interval '20 minutes',
   '{"identity":25,"documents":14,"verification":6,"history":8,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb),
  (gen_random_uuid(), 'aaaa0006-0000-0000-0000-000000000001', 'Komatsu PC210LC', 'Komatsu', 'PC210LC-11', 'KMTPC2102019001', 2019, 'excavator', 5200, 'active', 'L2', 48,
   57.7100, 11.9800, now() - interval '3 hours',
   '{"identity":24,"documents":12,"verification":6,"history":6,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb),
  (gen_random_uuid(), 'aaaa0006-0000-0000-0000-000000000001', 'Doosan DX225LC', 'Doosan', 'DX225LC-5', 'DX225LC2020001', 2020, 'excavator', 3800, 'active', 'L2', 51,
   NULL, NULL, NULL,
   '{"identity":25,"documents":13,"verification":6,"history":7,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- === L3 MACHINES (8 st) - Har dokument, verifiering men saknar full GPS/foto/insurance ===
INSERT INTO public.machines
  (id, org_id, name, brand, model, serial_number, year, type, operating_hours, status, mii_level, trust_score, latitude, longitude, last_gps_update, trust_breakdown)
VALUES
  (gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000001', 'Volvo EC380E', 'Volvo', 'EC380E', 'VCEC380E2022001', 2022, 'excavator', 1600, 'active', 'L3', 74,
   59.3320, 18.0620, now() - interval '5 minutes',
   '{"identity":25,"documents":20,"verification":19,"history":10,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb),
  (gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000001', 'CAT 336', 'Caterpillar', '336', 'CAT3362021001', 2021, 'excavator', 2800, 'active', 'L3', 76,
   59.3290, 18.0700, now() - interval '10 minutes',
   '{"identity":25,"documents":21,"verification":19,"history":11,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb),
  (gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000001', 'Volvo L150H', 'Volvo', 'L150H', 'VCL150H2023001', 2023, 'wheel_loader', 650, 'active', 'L3', 79,
   59.3350, 18.0550, now() - interval '8 minutes',
   '{"identity":25,"documents":22,"verification":19,"history":13,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb),
  (gen_random_uuid(), 'aaaa0002-0000-0000-0000-000000000001', 'Komatsu PC360LC', 'Komatsu', 'PC360LC-11', 'KMTPC3602022001', 2022, 'excavator', 1900, 'active', 'L3', 72,
   57.7080, 11.9690, now() - interval '25 minutes',
   '{"identity":25,"documents":18,"verification":19,"history":10,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb),
  (gen_random_uuid(), 'aaaa0002-0000-0000-0000-000000000001', 'Hitachi ZX350LC', 'Hitachi', 'ZX350LC-6', 'HTZX3502021001', 2021, 'excavator', 2400, 'active', 'L3', 75,
   57.7030, 11.9760, now() - interval '40 minutes',
   '{"identity":25,"documents":20,"verification":19,"history":11,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb),
  (gen_random_uuid(), 'aaaa0002-0000-0000-0000-000000000001', 'Volvo A40G', 'Volvo', 'A40G', 'VCA40G2020001', 2020, 'dumper', 3600, 'active', 'L3', 71,
   57.7010, 11.9700, now() - interval '1 hour',
   '{"identity":25,"documents":18,"verification":19,"history":9,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb),
  (gen_random_uuid(), 'aaaa0006-0000-0000-0000-000000000001', 'Liebherr R930', 'Liebherr', 'R930', 'LBHR9302022001', 2022, 'excavator', 1100, 'active', 'L3', 77,
   57.6950, 11.9820, now() - interval '15 minutes',
   '{"identity":25,"documents":21,"verification":19,"history":12,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb),
  (gen_random_uuid(), 'aaaa0006-0000-0000-0000-000000000001', 'Volvo EC250E', 'Volvo', 'EC250E', 'VCEC250E2023001', 2023, 'excavator', 480, 'active', 'L3', 80,
   57.6990, 11.9780, now() - interval '3 minutes',
   '{"identity":25,"documents":22,"verification":19,"history":14,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- === L4 MACHINES (4 st) - Fullt verifierade, GPS, foton, försäkring ===
INSERT INTO public.machines
  (id, org_id, name, brand, model, serial_number, year, type, operating_hours, status, mii_level, trust_score, latitude, longitude, last_gps_update, trust_breakdown)
VALUES
  (gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000001', 'Volvo EC480E [Premium]', 'Volvo', 'EC480E', 'VCEC480E2023001', 2023, 'excavator', 380, 'active', 'L4', 95,
   59.3340, 18.0590, now() - interval '2 minutes',
   '{"identity":25,"documents":24,"verification":24,"history":22,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb),
  (gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000001', 'CAT 352', 'Caterpillar', '352', 'CAT3522022001', 2022, 'excavator', 1200, 'active', 'L4', 92,
   59.3300, 18.0680, now() - interval '5 minutes',
   '{"identity":25,"documents":23,"verification":24,"history":20,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb),
  (gen_random_uuid(), 'aaaa0002-0000-0000-0000-000000000001', 'Komatsu PC490LC [Premium]', 'Komatsu', 'PC490LC-11', 'KMTPC4902023001', 2023, 'excavator', 520, 'active', 'L4', 96,
   57.7060, 11.9710, now() - interval '1 minute',
   '{"identity":25,"documents":25,"verification":24,"history":22,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb),
  (gen_random_uuid(), 'aaaa0006-0000-0000-0000-000000000001', 'Volvo L180H [Premium]', 'Volvo', 'L180H', 'VCL180H2023001', 2023, 'wheel_loader', 290, 'active', 'L4', 93,
   57.6970, 11.9790, now() - interval '4 minutes',
   '{"identity":25,"documents":23,"verification":24,"history":21,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Step 4: 3 specifika scenarier (FAST UUIDs)
-- =============================================================================
INSERT INTO public.machines
  (id, org_id, name, brand, model, serial_number, year, type, operating_hours, status, mii_level, trust_score, latitude, longitude, last_gps_update, trust_breakdown)
VALUES
  -- Scenario A: Lag risk (L4, trust 94)
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001',
   'aaaa0001-0000-0000-0000-000000000001',
   'EC220E [Scenario A: Lag risk]', 'Volvo', 'EC220E', 'VCEEC220KP9999A', 2023,
   'excavator', 980, 'active', 'L4', 94,
   59.3293, 18.0686, now() - interval '3 minutes',
   '{"identity":24,"documents":23,"verification":24,"history":23,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25,"_demo":true,"_scenario":"A"}'::jsonb),

  -- Scenario B: Oklar agare (L1, trust 32)
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0002',
   'aaaa0001-0000-0000-0000-000000000001',
   'Cat 320 [Scenario B: Oklar agare]', 'Caterpillar', '320', 'CAT0320KP9999B', 2019,
   'excavator', 8400, 'active', 'L1', 32,
   NULL, NULL, NULL,
   '{"identity":22,"documents":0,"verification":6,"history":4,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25,"_demo":true,"_scenario":"B"}'::jsonb),

  -- Scenario C: Hogvardesmaskin (L3, trust 78)
  ('cccccccc-cccc-cccc-cccc-cccccccc0003',
   'aaaa0006-0000-0000-0000-000000000001',
   'PC490LC-11 [Scenario C: Hogvardesmaskin]', 'Komatsu', 'PC490LC-11', 'KMTPC490KP9999C', 2021,
   'excavator', 3200, 'active', 'L3', 78,
   57.7089, 11.9746, now() - interval '12 minutes',
   '{"identity":25,"documents":20,"verification":19,"history":14,"identity_max":25,"documents_max":25,"verification_max":25,"history_max":25,"_demo":true,"_scenario":"C"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  mii_level = EXCLUDED.mii_level,
  trust_score = EXCLUDED.trust_score,
  trust_breakdown = EXCLUDED.trust_breakdown;

-- =============================================================================
-- Step 5: Ägarhistorik for Scenario C (2 tidigare ägare)
-- =============================================================================
INSERT INTO public.ownership_history (id, machine_id, org_id, from_date, to_date, transfer_method) VALUES
  (gen_random_uuid(), 'cccccccc-cccc-cccc-cccc-cccccccc0003', 'aaaa0002-0000-0000-0000-000000000001', '2021-03-15', '2022-08-20', 'sale'),
  (gen_random_uuid(), 'cccccccc-cccc-cccc-cccc-cccccccc0003', 'aaaa0001-0000-0000-0000-000000000001', '2022-08-21', '2023-11-10', 'sale'),
  (gen_random_uuid(), 'cccccccc-cccc-cccc-cccc-cccccccc0003', 'aaaa0006-0000-0000-0000-000000000001', '2023-11-11', NULL, 'sale')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Step 6: 9 fler consents (mål 15 totalt)
-- =============================================================================
INSERT INTO public.data_sharing_consents
  (id, customer_org_id, viewer_org_id, viewer_type, consent_level, purpose, granted_at, expires_at)
VALUES
  -- Karlsson -> Lansforsakringar
  (gen_random_uuid(), 'aaaa0002-0000-0000-0000-000000000001', 'cccc0002-0000-0000-0000-000000000001', 'insurance', 2, 'Forsakringsunderlag', now() - interval '45 days', now() + interval '320 days'),

  -- Peab -> Nordea, SEB, If, Volvo FS, Swecon, Hesselberg
  (gen_random_uuid(), 'aaaa0006-0000-0000-0000-000000000001', 'bbbb0001-0000-0000-0000-000000000001', 'finance', 3, 'Maskinfinansiering', now() - interval '120 days', now() + interval '245 days'),
  (gen_random_uuid(), 'aaaa0006-0000-0000-0000-000000000001', 'bbbb0002-0000-0000-0000-000000000001', 'finance', 2, 'Leasingavtal', now() - interval '90 days', now() + interval '275 days'),
  (gen_random_uuid(), 'aaaa0006-0000-0000-0000-000000000001', 'cccc0001-0000-0000-0000-000000000001', 'insurance', 3, 'Fullstandig forsakringsanalys', now() - interval '60 days', now() + interval '305 days'),
  (gen_random_uuid(), 'aaaa0006-0000-0000-0000-000000000001', 'dddd0001-0000-0000-0000-000000000001', 'leasing', 3, 'Finansiering via VFS', now() - interval '30 days', now() + interval '335 days'),
  (gen_random_uuid(), 'aaaa0006-0000-0000-0000-000000000001', 'eeee0001-0000-0000-0000-000000000001', 'service_partner', 2, 'Serviceavtal', now() - interval '15 days', now() + interval '350 days'),
  (gen_random_uuid(), 'aaaa0006-0000-0000-0000-000000000001', 'eeee0002-0000-0000-0000-000000000001', 'service_partner', 1, 'Reservdelsservice', now() - interval '10 days', now() + interval '355 days'),

  -- Svensson -> Volvo FS, SEB
  (gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000001', 'dddd0001-0000-0000-0000-000000000001', 'leasing', 2, 'Leasingfinansiering', now() - interval '180 days', now() + interval '185 days'),
  (gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000001', 'bbbb0002-0000-0000-0000-000000000001', 'finance', 3, 'Kreditbedomning', now() - interval '200 days', now() + interval '165 days')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Step 7: Återaktivera triggers
-- =============================================================================
ALTER TABLE public.machines ENABLE TRIGGER IF EXISTS trg_machines_recalc;
ALTER TABLE public.machine_events ENABLE TRIGGER IF EXISTS trg_machine_events_recalc;
ALTER TABLE public.documents ENABLE TRIGGER IF EXISTS trg_documents_recalc;
DO $$ BEGIN
  ALTER TABLE public.machine_verifications ENABLE TRIGGER trg_machine_verifications_recalc;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

COMMIT;

-- =============================================================================
-- VERIFY
-- =============================================================================
SELECT mii_level, count(*) as count FROM public.machines GROUP BY mii_level ORDER BY mii_level;
-- Expected: L0 ~9, L1 ~11, L2 ~10, L3 ~11, L4 ~7

SELECT org_type, count(*) as count FROM public.organizations GROUP BY org_type ORDER BY count DESC;
-- Expected: machine_owner 5-6, finance 3, insurance 3, leasing 2, service_partner 2, dealer 1

SELECT count(*) as consent_count FROM public.data_sharing_consents;
-- Expected: 15

SELECT id, name, mii_level, trust_score FROM public.machines
WHERE id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0002', 'cccccccc-cccc-cccc-cccc-cccccccc0003');
-- Expected: Scenario A (L4, 94), Scenario B (L1, 32), Scenario C (L3, 78)

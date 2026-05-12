-- =============================================================================
-- v02_demo_data.sql — Demo Seed for MachIndex Core v0.2
-- =============================================================================
-- IDEMPOTENT: Uses ON CONFLICT DO NOTHING where possible
-- RUN: psql -f supabase/seed/v02_demo_data.sql OR paste in Supabase SQL Editor
--
-- Creates:
--   15 organizations (5 machine_owner, 3 finance, 3 insurance, 2 leasing, 2 service)
--   75 machines distributed across the 5 machine owner orgs
--   3 showcase scenarios (A: L4/94, B: L1/32, C: L3/78 with ownership history)
--   Documents for L2+ machines
--   15 data sharing consents
--   Machine events for history
--
-- NOTE: Users must be created via Supabase Auth UI, then linked manually.
--       See MANUAL STEPS section at the end.
-- =============================================================================

-- =============================================================================
-- 1. ORGANIZATIONS (15 total)
-- =============================================================================

-- 5 Machine Owner organizations
INSERT INTO public.organizations (id, name, org_number, country, logo_url, timezone, org_type)
VALUES
  -- Org 1: Large construction company (25 machines)
  ('11111111-0000-0000-0000-000000000001', 'Svensson Bygg & Maskin AB', '556123-4567', 'SE', NULL, 'Europe/Stockholm', 'machine_owner'),
  -- Org 2: Medium logistics company (18 machines)
  ('11111111-0000-0000-0000-000000000002', 'Nordic Logistics AB', '556234-5678', 'SE', NULL, 'Europe/Stockholm', 'machine_owner'),
  -- Org 3: Agricultural business (15 machines)
  ('11111111-0000-0000-0000-000000000003', 'Österlen Lantbruk', '556345-6789', 'SE', NULL, 'Europe/Stockholm', 'machine_owner'),
  -- Org 4: Small contractor (10 machines)
  ('11111111-0000-0000-0000-000000000004', 'Malmö Entreprenad HB', '969812-3456', 'SE', NULL, 'Europe/Stockholm', 'machine_owner'),
  -- Org 5: Rental company (7 machines)
  ('11111111-0000-0000-0000-000000000005', 'Maskinuthyrning Norr', '556456-7890', 'SE', NULL, 'Europe/Stockholm', 'machine_owner')
ON CONFLICT (id) DO NOTHING;

-- 3 Finance organizations
INSERT INTO public.organizations (id, name, org_number, country, logo_url, timezone, org_type)
VALUES
  ('22222222-0000-0000-0000-000000000001', 'Nordea Maskinfinans', '516406-0120', 'SE', NULL, 'Europe/Stockholm', 'finance'),
  ('22222222-0000-0000-0000-000000000002', 'SEB Leasing AB', '556132-5986', 'SE', NULL, 'Europe/Stockholm', 'finance'),
  ('22222222-0000-0000-0000-000000000003', 'Volvo Financial Services', '556033-5765', 'SE', NULL, 'Europe/Stockholm', 'finance')
ON CONFLICT (id) DO NOTHING;

-- 3 Insurance organizations
INSERT INTO public.organizations (id, name, org_number, country, logo_url, timezone, org_type)
VALUES
  ('33333333-0000-0000-0000-000000000001', 'If Skadeförsäkring', '516401-8102', 'SE', NULL, 'Europe/Stockholm', 'insurance'),
  ('33333333-0000-0000-0000-000000000002', 'Trygg-Hansa Maskinförsäkring', '516401-7799', 'SE', NULL, 'Europe/Stockholm', 'insurance'),
  ('33333333-0000-0000-0000-000000000003', 'Länsförsäkringar Skåne', '543002-0012', 'SE', NULL, 'Europe/Stockholm', 'insurance')
ON CONFLICT (id) DO NOTHING;

-- 2 Leasing organizations
INSERT INTO public.organizations (id, name, org_number, country, logo_url, timezone, org_type)
VALUES
  ('44444444-0000-0000-0000-000000000001', 'Wasa Kredit AB', '556311-9204', 'SE', NULL, 'Europe/Stockholm', 'leasing'),
  ('44444444-0000-0000-0000-000000000002', 'Arval BNP Paribas', '556696-7780', 'SE', NULL, 'Europe/Stockholm', 'leasing')
ON CONFLICT (id) DO NOTHING;

-- 2 Service Partner organizations
INSERT INTO public.organizations (id, name, org_number, country, logo_url, timezone, org_type)
VALUES
  ('55555555-0000-0000-0000-000000000001', 'Swecon Service Center', '556011-6925', 'SE', NULL, 'Europe/Stockholm', 'service_partner'),
  ('55555555-0000-0000-0000-000000000002', 'Volvo Maskin Syd', '556234-9012', 'SE', NULL, 'Europe/Stockholm', 'service_partner')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. MACHINES (75 total, distributed across 5 machine owner orgs)
-- =============================================================================

-- Helper: Machine type/category mapping
-- excavator, wheel_loader, forklift, telehandler, tractor, combine, dumper, crane, generator, compressor

-- -----------------------------------------------------------------------------
-- ORG 1: Svensson Bygg & Maskin AB (25 machines) - Construction focused
-- -----------------------------------------------------------------------------
INSERT INTO public.machines (id, org_id, name, type, brand, model, year, serial_number, registration_number, status, operating_hours, image_url, latitude, longitude, last_gps_update, estimated_residual_value, next_service_hours)
VALUES
  -- Excavators (8)
  ('aaaa0001-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Grävmaskin 320', 'excavator', 'Caterpillar', '320 GC', 2022, 'CAT0320GC22A001', NULL, 'active', 2450, NULL, 55.6050, 13.0038, NOW() - INTERVAL '2 hours', 1850000, 3000),
  ('aaaa0001-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'Grävmaskin 330', 'excavator', 'Caterpillar', '330 GC', 2021, 'CAT0330GC21A002', NULL, 'active', 4120, NULL, 55.6055, 13.0045, NOW() - INTERVAL '1 hour', 2100000, 5000),
  ('aaaa0001-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 'Volvo Grävare EC220', 'excavator', 'Volvo', 'EC220E', 2020, 'VCEC220E20A003', NULL, 'active', 5890, NULL, 55.5980, 13.0120, NOW() - INTERVAL '30 minutes', 1450000, 6500),
  ('aaaa0001-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001', 'Komatsu PC210', 'excavator', 'Komatsu', 'PC210LC-11', 2019, 'KMTPC210LC19A04', NULL, 'active', 7230, NULL, NULL, NULL, NULL, 1200000, 8000),
  ('aaaa0001-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001', 'Hitachi ZX225', 'excavator', 'Hitachi', 'ZX225USLC-6', 2021, 'HTZX225US21A005', NULL, 'active', 3650, NULL, 55.6120, 13.0200, NOW() - INTERVAL '4 hours', 1650000, 4500),
  ('aaaa0001-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000001', 'Mini Grävare', 'excavator', 'Kubota', 'KX080-4', 2023, 'KBT0804A23A006', NULL, 'active', 890, NULL, 55.5900, 12.9980, NOW() - INTERVAL '6 hours', 650000, 1500),
  ('aaaa0001-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000001', 'Bandgrävare JCB', 'excavator', 'JCB', '220X', 2020, 'JCB220X2020A007', NULL, 'active', 5120, NULL, NULL, NULL, NULL, 1380000, 6000),
  ('aaaa0001-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000001', 'Kobelco SK210', 'excavator', 'Kobelco', 'SK210LC-10', 2018, 'KBLSK210LC18A08', NULL, 'inactive', 8950, NULL, NULL, NULL, NULL, 950000, NULL),

  -- Wheel Loaders (6)
  ('aaaa0001-0000-0000-0000-000000000009', '11111111-0000-0000-0000-000000000001', 'Volvo Hjullastare L90', 'wheel_loader', 'Volvo', 'L90H', 2021, 'VCL90H2021A009', NULL, 'active', 3890, NULL, 55.6080, 13.0100, NOW() - INTERVAL '45 minutes', 1750000, 4500),
  ('aaaa0001-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000001', 'CAT Hjullastare 950', 'wheel_loader', 'Caterpillar', '950M', 2020, 'CAT950M2020A010', NULL, 'active', 4560, NULL, 55.6090, 13.0080, NOW() - INTERVAL '3 hours', 1950000, 5500),
  ('aaaa0001-0000-0000-0000-000000000011', '11111111-0000-0000-0000-000000000001', 'Komatsu WA380', 'wheel_loader', 'Komatsu', 'WA380-8', 2019, 'KMTWA380820A011', NULL, 'active', 6780, NULL, NULL, NULL, NULL, 1350000, 7500),
  ('aaaa0001-0000-0000-0000-000000000012', '11111111-0000-0000-0000-000000000001', 'Volvo Hjullastare L60', 'wheel_loader', 'Volvo', 'L60H', 2022, 'VCL60H2022A012', NULL, 'active', 2100, NULL, 55.5950, 13.0150, NOW() - INTERVAL '20 minutes', 1250000, 3000),
  ('aaaa0001-0000-0000-0000-000000000013', '11111111-0000-0000-0000-000000000001', 'Liebherr L546', 'wheel_loader', 'Liebherr', 'L 546', 2020, 'LBHL5462020A013', NULL, 'active', 5230, NULL, NULL, NULL, NULL, 1580000, 6000),
  ('aaaa0001-0000-0000-0000-000000000014', '11111111-0000-0000-0000-000000000001', 'Case 821G', 'wheel_loader', 'Case', '821G', 2018, 'CSE821G2018A014', NULL, 'sold', 9120, NULL, NULL, NULL, NULL, 850000, NULL),

  -- Dumpers (4)
  ('aaaa0001-0000-0000-0000-000000000015', '11111111-0000-0000-0000-000000000001', 'Volvo Dumper A30G', 'dumper', 'Volvo', 'A30G', 2021, 'VCA30G2021A015', NULL, 'active', 3450, NULL, 55.6100, 13.0050, NOW() - INTERVAL '1 hour', 2850000, 4000),
  ('aaaa0001-0000-0000-0000-000000000016', '11111111-0000-0000-0000-000000000001', 'Bell B30E', 'dumper', 'Bell', 'B30E', 2020, 'BELLB30E20A016', NULL, 'active', 4890, NULL, NULL, NULL, NULL, 2450000, 5500),
  ('aaaa0001-0000-0000-0000-000000000017', '11111111-0000-0000-0000-000000000001', 'CAT Dumper 730', 'dumper', 'Caterpillar', '730', 2019, 'CAT7302019A017', NULL, 'active', 6120, NULL, 55.5880, 13.0220, NOW() - INTERVAL '5 hours', 2100000, 7000),
  ('aaaa0001-0000-0000-0000-000000000018', '11111111-0000-0000-0000-000000000001', 'Volvo Dumper A25G', 'dumper', 'Volvo', 'A25G', 2022, 'VCA25G2022A018', NULL, 'active', 1890, NULL, 55.6030, 13.0180, NOW() - INTERVAL '2 hours', 2650000, 2500),

  -- Cranes (3)
  ('aaaa0001-0000-0000-0000-000000000019', '11111111-0000-0000-0000-000000000001', 'Liebherr Mobilkran', 'crane', 'Liebherr', 'LTM 1060-3.1', 2020, 'LBHLTM106020A19', NULL, 'active', 2340, NULL, 55.6070, 13.0130, NOW() - INTERVAL '8 hours', 4500000, 3000),
  ('aaaa0001-0000-0000-0000-000000000020', '11111111-0000-0000-0000-000000000001', 'Tadano Mobilkran', 'crane', 'Tadano', 'ATF 70G-4', 2019, 'TATATF70G419A20', NULL, 'active', 3560, NULL, NULL, NULL, NULL, 3800000, 4500),
  ('aaaa0001-0000-0000-0000-000000000021', '11111111-0000-0000-0000-000000000001', 'Grove Terrängkran', 'crane', 'Grove', 'RT890E', 2021, 'GRVRT890E21A021', NULL, 'active', 1890, NULL, 55.5920, 13.0090, NOW() - INTERVAL '12 hours', 3200000, 2500),

  -- Telehandlers (2)
  ('aaaa0001-0000-0000-0000-000000000022', '11111111-0000-0000-0000-000000000001', 'Manitou Teleskop', 'telehandler', 'Manitou', 'MT 1440', 2022, 'MNTMT144022A022', NULL, 'active', 1450, NULL, 55.6040, 13.0060, NOW() - INTERVAL '30 minutes', 980000, 2000),
  ('aaaa0001-0000-0000-0000-000000000023', '11111111-0000-0000-0000-000000000001', 'JCB Teleskoplastare', 'telehandler', 'JCB', '540-180', 2021, 'JCB540180A21A23', NULL, 'active', 2780, NULL, NULL, NULL, NULL, 1150000, 3500),

  -- Generators (2)
  ('aaaa0001-0000-0000-0000-000000000024', '11111111-0000-0000-0000-000000000001', 'Atlas Copco Generator', 'generator', 'Atlas Copco', 'QAS 500', 2021, 'ACQAS50021A024', NULL, 'active', 1230, NULL, 55.6060, 13.0070, NOW() - INTERVAL '4 hours', 450000, 1500),
  ('aaaa0001-0000-0000-0000-000000000025', '11111111-0000-0000-0000-000000000001', 'CAT Generator', 'generator', 'Caterpillar', 'DE500E0', 2020, 'CATDE500E020A25', NULL, 'active', 2890, NULL, NULL, NULL, NULL, 520000, 3500)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- ORG 2: Nordic Logistics AB (18 machines) - Forklift/warehouse focused
-- -----------------------------------------------------------------------------
INSERT INTO public.machines (id, org_id, name, type, brand, model, year, serial_number, registration_number, status, operating_hours, image_url, latitude, longitude, last_gps_update, estimated_residual_value, next_service_hours)
VALUES
  -- Forklifts (14)
  ('aaaa0002-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', 'Toyota Truck 1', 'forklift', 'Toyota', '8FGCU25', 2022, 'TOY8FGCU2522B01', NULL, 'active', 1890, NULL, 55.7090, 13.1850, NOW() - INTERVAL '15 minutes', 285000, 2500),
  ('aaaa0002-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', 'Toyota Truck 2', 'forklift', 'Toyota', '8FGCU25', 2022, 'TOY8FGCU2522B02', NULL, 'active', 2150, NULL, 55.7095, 13.1855, NOW() - INTERVAL '20 minutes', 280000, 2500),
  ('aaaa0002-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', 'Linde El-truck', 'forklift', 'Linde', 'E30', 2021, 'LNDE302021B003', NULL, 'active', 3450, NULL, 55.7100, 13.1860, NOW() - INTERVAL '1 hour', 320000, 4000),
  ('aaaa0002-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000002', 'Linde Skjutstativtruck', 'forklift', 'Linde', 'R16', 2020, 'LNDR162020B004', NULL, 'active', 4890, NULL, 55.7085, 13.1840, NOW() - INTERVAL '2 hours', 195000, 5500),
  ('aaaa0002-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000002', 'Hangcha Diesel', 'forklift', 'Hangcha', 'CPCD50', 2021, 'HCCPCD5021B005', NULL, 'active', 2780, NULL, NULL, NULL, NULL, 185000, 3500),
  ('aaaa0002-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000002', 'Hangcha El 3t', 'forklift', 'Hangcha', 'CPD30', 2022, 'HCCPD302022B006', NULL, 'active', 1560, NULL, 55.7080, 13.1835, NOW() - INTERVAL '30 minutes', 165000, 2000),
  ('aaaa0002-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000002', 'Jungheinrich EFG', 'forklift', 'Jungheinrich', 'EFG 220', 2020, 'JHEFG22020B007', NULL, 'active', 5120, NULL, 55.7088, 13.1842, NOW() - INTERVAL '45 minutes', 145000, 6000),
  ('aaaa0002-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000002', 'Still El-truck', 'forklift', 'Still', 'RX 60-30', 2021, 'STLRX603021B008', NULL, 'active', 3210, NULL, NULL, NULL, NULL, 225000, 4000),
  ('aaaa0002-0000-0000-0000-000000000009', '11111111-0000-0000-0000-000000000002', 'CAT Motviktstruck', 'forklift', 'Caterpillar', 'GP25N', 2019, 'CATGP25N19B009', NULL, 'active', 6780, NULL, 55.7092, 13.1848, NOW() - INTERVAL '3 hours', 125000, 7500),
  ('aaaa0002-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000002', 'Hyster Dieseltruck', 'forklift', 'Hyster', 'H3.0FT', 2020, 'HYSH30FT20B010', NULL, 'active', 4560, NULL, NULL, NULL, NULL, 165000, 5500),
  ('aaaa0002-0000-0000-0000-000000000011', '11111111-0000-0000-0000-000000000002', 'Crown Plockare', 'forklift', 'Crown', 'PC 4500', 2022, 'CRWPC450022B011', NULL, 'active', 1230, NULL, 55.7098, 13.1858, NOW() - INTERVAL '10 minutes', 95000, 1500),
  ('aaaa0002-0000-0000-0000-000000000012', '11111111-0000-0000-0000-000000000002', 'BT Ledstaplare', 'forklift', 'BT', 'SWE 160', 2021, 'BTSWE16021B012', NULL, 'active', 2890, NULL, 55.7082, 13.1838, NOW() - INTERVAL '1 hour', 78000, 3500),
  ('aaaa0002-0000-0000-0000-000000000013', '11111111-0000-0000-0000-000000000002', 'Yale Dieseltruck', 'forklift', 'Yale', 'GDP40VX', 2018, 'YLEGDP40VX18B13', NULL, 'inactive', 8450, NULL, NULL, NULL, NULL, 85000, NULL),
  ('aaaa0002-0000-0000-0000-000000000014', '11111111-0000-0000-0000-000000000002', 'Mitsubishi Eltruck', 'forklift', 'Mitsubishi', 'FB25CN', 2023, 'MTSFB25CN23B014', NULL, 'active', 650, NULL, 55.7105, 13.1865, NOW() - INTERVAL '5 minutes', 310000, 1000),

  -- Telehandlers (2)
  ('aaaa0002-0000-0000-0000-000000000015', '11111111-0000-0000-0000-000000000002', 'Merlo Teleskop', 'telehandler', 'Merlo', 'P40.17', 2021, 'MRLP401721B015', NULL, 'active', 2340, NULL, 55.7078, 13.1830, NOW() - INTERVAL '4 hours', 650000, 3000),
  ('aaaa0002-0000-0000-0000-000000000016', '11111111-0000-0000-0000-000000000002', 'JCB Teleskop 535', 'telehandler', 'JCB', '535-140', 2020, 'JCB53514020B016', NULL, 'active', 3890, NULL, NULL, NULL, NULL, 580000, 4500),

  -- Wheel Loaders (2)
  ('aaaa0002-0000-0000-0000-000000000017', '11111111-0000-0000-0000-000000000002', 'Volvo Kompaktlastare', 'wheel_loader', 'Volvo', 'L45H', 2022, 'VCL45H2022B017', NULL, 'active', 1560, NULL, 55.7075, 13.1825, NOW() - INTERVAL '2 hours', 520000, 2000),
  ('aaaa0002-0000-0000-0000-000000000018', '11111111-0000-0000-0000-000000000002', 'CAT Hjullastare 906', 'wheel_loader', 'Caterpillar', '906M', 2021, 'CAT906M2021B018', NULL, 'active', 2780, NULL, NULL, NULL, NULL, 480000, 3500)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- ORG 3: Österlen Lantbruk (15 machines) - Agricultural focus
-- -----------------------------------------------------------------------------
INSERT INTO public.machines (id, org_id, name, type, brand, model, year, serial_number, registration_number, status, operating_hours, image_url, latitude, longitude, last_gps_update, estimated_residual_value, next_service_hours)
VALUES
  -- Tractors (6)
  ('aaaa0003-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003', 'John Deere 6R', 'tractor', 'John Deere', '6R 250', 2022, 'JD6R2502022C001', 'ABC123', 'active', 1890, NULL, 55.4520, 14.1230, NOW() - INTERVAL '30 minutes', 1850000, 2500),
  ('aaaa0003-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000003', 'Fendt 724 Vario', 'tractor', 'Fendt', '724 Vario', 2021, 'FDT724VAR21C002', 'DEF456', 'active', 3450, NULL, 55.4525, 14.1235, NOW() - INTERVAL '1 hour', 1650000, 4000),
  ('aaaa0003-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003', 'Valtra T234', 'tractor', 'Valtra', 'T234 Direct', 2020, 'VALT234D20C003', 'GHI789', 'active', 4890, NULL, 55.4530, 14.1240, NOW() - INTERVAL '2 hours', 1350000, 5500),
  ('aaaa0003-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000003', 'Case IH Puma', 'tractor', 'Case IH', 'Puma 240', 2019, 'CSEPUMA24019C04', 'JKL012', 'active', 6120, NULL, NULL, NULL, NULL, 1150000, 7000),
  ('aaaa0003-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000003', 'New Holland T7', 'tractor', 'New Holland', 'T7.315', 2021, 'NHT731521C005', NULL, 'active', 2780, NULL, 55.4535, 14.1245, NOW() - INTERVAL '3 hours', 1550000, 3500),
  ('aaaa0003-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000003', 'Massey Ferguson 8S', 'tractor', 'Massey Ferguson', '8S.265', 2022, 'MF8S26522C006', NULL, 'active', 1560, NULL, 55.4540, 14.1250, NOW() - INTERVAL '45 minutes', 1750000, 2000),

  -- Combines (3)
  ('aaaa0003-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000003', 'Claas Lexion 770', 'combine', 'Claas', 'Lexion 770', 2020, 'CLSLXN77020C007', NULL, 'active', 1230, NULL, 55.4545, 14.1255, NOW() - INTERVAL '6 hours', 3200000, 1500),
  ('aaaa0003-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000003', 'John Deere S780', 'combine', 'John Deere', 'S780', 2021, 'JDS78021C008', NULL, 'active', 890, NULL, 55.4550, 14.1260, NOW() - INTERVAL '8 hours', 3800000, 1200),
  ('aaaa0003-0000-0000-0000-000000000009', '11111111-0000-0000-0000-000000000003', 'New Holland CR', 'combine', 'New Holland', 'CR9.90', 2019, 'NHCR99019C009', NULL, 'active', 1650, NULL, NULL, NULL, NULL, 2850000, 2000),

  -- Telehandlers (2)
  ('aaaa0003-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000003', 'JCB Agri Teleskop', 'telehandler', 'JCB', '542-70 Agri Pro', 2021, 'JCB54270AP21C10', NULL, 'active', 2340, NULL, 55.4515, 14.1225, NOW() - INTERVAL '4 hours', 720000, 3000),
  ('aaaa0003-0000-0000-0000-000000000011', '11111111-0000-0000-0000-000000000003', 'Manitou MLT 840', 'telehandler', 'Manitou', 'MLT 840-137', 2020, 'MNTMLT84020C011', NULL, 'active', 3560, NULL, NULL, NULL, NULL, 650000, 4500),

  -- Wheel Loaders (2)
  ('aaaa0003-0000-0000-0000-000000000012', '11111111-0000-0000-0000-000000000003', 'Kramer KL 35.8T', 'wheel_loader', 'Kramer', 'KL 35.8T', 2022, 'KRMKL358T22C012', NULL, 'active', 1230, NULL, 55.4510, 14.1220, NOW() - INTERVAL '5 hours', 380000, 1500),
  ('aaaa0003-0000-0000-0000-000000000013', '11111111-0000-0000-0000-000000000003', 'Weidemann 5080T', 'wheel_loader', 'Weidemann', '5080T', 2021, 'WDMN5080T21C013', NULL, 'active', 2560, NULL, 55.4505, 14.1215, NOW() - INTERVAL '7 hours', 320000, 3000),

  -- Spreaders/Sprayers (2)
  ('aaaa0003-0000-0000-0000-000000000014', '11111111-0000-0000-0000-000000000003', 'Amazone ZA-TS', 'spreader', 'Amazone', 'ZA-TS 4200', 2021, 'AMZZATS420021C14', NULL, 'active', 450, NULL, NULL, NULL, NULL, 185000, 600),
  ('aaaa0003-0000-0000-0000-000000000015', '11111111-0000-0000-0000-000000000003', 'Hardi Navigator', 'sprayer', 'Hardi', 'Navigator 4000', 2020, 'HRDNAV400020C015', NULL, 'active', 680, NULL, 55.4555, 14.1265, NOW() - INTERVAL '10 hours', 420000, 800)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- ORG 4: Malmö Entreprenad HB (10 machines) - Small contractor
-- -----------------------------------------------------------------------------
INSERT INTO public.machines (id, org_id, name, type, brand, model, year, serial_number, registration_number, status, operating_hours, image_url, latitude, longitude, last_gps_update, estimated_residual_value, next_service_hours)
VALUES
  -- Excavators (4)
  ('aaaa0004-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000004', 'Volvo Minigrävare', 'excavator', 'Volvo', 'ECR58', 2021, 'VCECR5821D001', NULL, 'active', 2890, NULL, 55.5820, 13.0450, NOW() - INTERVAL '1 hour', 380000, 3500),
  ('aaaa0004-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000004', 'Takeuchi TB260', 'excavator', 'Takeuchi', 'TB260', 2020, 'TAKTB26020D002', NULL, 'active', 4120, NULL, 55.5825, 13.0455, NOW() - INTERVAL '2 hours', 320000, 5000),
  ('aaaa0004-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000004', 'Bobcat E85', 'excavator', 'Bobcat', 'E85', 2022, 'BCTE852022D003', NULL, 'active', 1560, NULL, NULL, NULL, NULL, 450000, 2000),
  ('aaaa0004-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000004', 'Yanmar ViO55', 'excavator', 'Yanmar', 'ViO55-6B', 2019, 'YMRVIO556B19D04', NULL, 'active', 5890, NULL, 55.5830, 13.0460, NOW() - INTERVAL '4 hours', 280000, 6500),

  -- Wheel Loaders (2)
  ('aaaa0004-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000004', 'JCB Kompaktlastare', 'wheel_loader', 'JCB', '407', 2021, 'JCB4072021D005', NULL, 'active', 2340, NULL, 55.5835, 13.0465, NOW() - INTERVAL '3 hours', 285000, 3000),
  ('aaaa0004-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000004', 'Avant 760i', 'wheel_loader', 'Avant', '760i', 2022, 'AVT760I22D006', NULL, 'active', 1230, NULL, NULL, NULL, NULL, 165000, 1500),

  -- Dumpers (2)
  ('aaaa0004-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000004', 'Wacker Neuson 6001', 'dumper', 'Wacker Neuson', '6001', 2021, 'WN600121D007', NULL, 'active', 1890, NULL, 55.5840, 13.0470, NOW() - INTERVAL '5 hours', 145000, 2500),
  ('aaaa0004-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000004', 'Thwaites 9t', 'dumper', 'Thwaites', '9 Tonne', 2020, 'THW9T2020D008', NULL, 'active', 3120, NULL, NULL, NULL, NULL, 125000, 4000),

  -- Compactors/Rollers (2)
  ('aaaa0004-0000-0000-0000-000000000009', '11111111-0000-0000-0000-000000000004', 'Bomag Vält', 'compactor', 'Bomag', 'BW 120 AD-5', 2021, 'BMGBW120AD521D9', NULL, 'active', 1450, NULL, 55.5845, 13.0475, NOW() - INTERVAL '6 hours', 95000, 2000),
  ('aaaa0004-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000004', 'Hamm HD 14', 'compactor', 'Hamm', 'HD 14 VV', 2020, 'HAMHD14VV20D010', NULL, 'active', 2780, NULL, NULL, NULL, NULL, 85000, 3500)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- ORG 5: Maskinuthyrning Norr (7 machines) - Rental fleet
-- -----------------------------------------------------------------------------
INSERT INTO public.machines (id, org_id, name, type, brand, model, year, serial_number, registration_number, status, operating_hours, image_url, latitude, longitude, last_gps_update, estimated_residual_value, next_service_hours)
VALUES
  -- Mixed rental fleet
  ('aaaa0005-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000005', 'Uthyrning Grävare 1', 'excavator', 'Volvo', 'EC140E', 2022, 'VCEC140E22E001', NULL, 'active', 1890, NULL, 63.8258, 20.2630, NOW() - INTERVAL '2 hours', 850000, 2500),
  ('aaaa0005-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000005', 'Uthyrning Grävare 2', 'excavator', 'Hitachi', 'ZX135US-6', 2021, 'HTZX135US621E02', NULL, 'active', 3120, NULL, 63.8262, 20.2635, NOW() - INTERVAL '3 hours', 720000, 4000),
  ('aaaa0005-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000005', 'Uthyrning Hjullastare', 'wheel_loader', 'Volvo', 'L70H', 2021, 'VCL70H2021E003', NULL, 'active', 2560, NULL, NULL, NULL, NULL, 980000, 3500),
  ('aaaa0005-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000005', 'Uthyrning Dumper', 'dumper', 'Volvo', 'A25F', 2020, 'VCA25F2020E004', NULL, 'active', 4230, NULL, 63.8265, 20.2640, NOW() - INTERVAL '5 hours', 1650000, 5000),
  ('aaaa0005-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000005', 'Uthyrning Teleskop', 'telehandler', 'Manitou', 'MT 1135', 2022, 'MNTMT113522E005', NULL, 'active', 1230, NULL, 63.8268, 20.2645, NOW() - INTERVAL '1 hour', 580000, 1500),
  ('aaaa0005-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000005', 'Uthyrning Generator', 'generator', 'Atlas Copco', 'QAS 250', 2021, 'ACQAS25021E006', NULL, 'active', 890, NULL, NULL, NULL, NULL, 285000, 1200),
  ('aaaa0005-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000005', 'Uthyrning Kompressor', 'compressor', 'Atlas Copco', 'XAS 188', 2022, 'ACXAS18822E007', NULL, 'active', 650, NULL, 63.8270, 20.2650, NOW() - INTERVAL '30 minutes', 125000, 1000)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 3. SHOWCASE SCENARIOS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- SCENARIO A: Premium machine with L4 trust (target: trust_score 94, mii_level L4)
-- Machine: aaaa0001-0000-0000-0000-000000000001 (Grävmaskin 320)
-- Requires: All fields, 5+ docs, verification, GPS, 3+ photos, insurance
-- -----------------------------------------------------------------------------

-- Documents for Scenario A (5 documents including 3 photos and insurance)
INSERT INTO public.documents (id, machine_id, org_id, document_type, title, file_path, file_size_bytes, mime_type, tags, metadata)
VALUES
  ('dddd0001-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'purchase_contract', 'Köpeavtal CAT 320 GC', 'demo/scenario-a/purchase_contract.pdf', 245000, 'application/pdf', ARRAY['kontrakt', 'köp'], '{"vendor": "Pon Equipment", "purchase_date": "2022-03-15"}'),
  ('dddd0001-0000-0000-0000-000000000002', 'aaaa0001-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'photo', 'Maskinbild framifrån', 'demo/scenario-a/photo_front.jpg', 1250000, 'image/jpeg', ARRAY['foto', 'exteriör'], '{"angle": "front"}'),
  ('dddd0001-0000-0000-0000-000000000003', 'aaaa0001-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'photo', 'Maskinbild sida', 'demo/scenario-a/photo_side.jpg', 1180000, 'image/jpeg', ARRAY['foto', 'exteriör'], '{"angle": "side"}'),
  ('dddd0001-0000-0000-0000-000000000004', 'aaaa0001-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'nameplate_photo', 'Typskylt', 'demo/scenario-a/nameplate.jpg', 890000, 'image/jpeg', ARRAY['foto', 'typskylt'], '{"verified": true}'),
  ('dddd0001-0000-0000-0000-000000000005', 'aaaa0001-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'insurance_policy', 'Försäkringsbrev If 2024', 'demo/scenario-a/insurance.pdf', 185000, 'application/pdf', ARRAY['försäkring'], '{"insurer": "If Skadeförsäkring", "valid_until": "2025-12-31"}'),
  ('dddd0001-0000-0000-0000-000000000006', 'aaaa0001-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'service_protocol', 'Serviceprotokoll 2500h', 'demo/scenario-a/service_2500h.pdf', 156000, 'application/pdf', ARRAY['service'], '{"hours_at_service": 2500, "service_type": "scheduled"}')
ON CONFLICT (id) DO NOTHING;

-- Machine events for Scenario A (10+ events for max history score)
INSERT INTO public.machine_events (id, machine_id, actor_user_id, event_type, title, description, metadata)
VALUES
  ('eeee0001-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000001', NULL, 'service', 'Service 500h', 'Första service genomförd', '{"hours": 500}'),
  ('eeee0001-0000-0000-0000-000000000002', 'aaaa0001-0000-0000-0000-000000000001', NULL, 'inspection', 'Besiktning', 'Årlig säkerhetsbesiktning godkänd', '{"result": "approved"}'),
  ('eeee0001-0000-0000-0000-000000000003', 'aaaa0001-0000-0000-0000-000000000001', NULL, 'service', 'Service 1000h', 'Planerad service genomförd', '{"hours": 1000}'),
  ('eeee0001-0000-0000-0000-000000000004', 'aaaa0001-0000-0000-0000-000000000001', NULL, 'repair', 'Hydraulikslang bytt', 'Preventivt byte av hydraulikslang', '{"part": "hydraulic_hose"}'),
  ('eeee0001-0000-0000-0000-000000000005', 'aaaa0001-0000-0000-0000-000000000001', NULL, 'service', 'Service 1500h', 'Planerad service genomförd', '{"hours": 1500}'),
  ('eeee0001-0000-0000-0000-000000000006', 'aaaa0001-0000-0000-0000-000000000001', NULL, 'document', 'Försäkring uppdaterad', 'Nytt försäkringsbrev uppladdad', '{}'),
  ('eeee0001-0000-0000-0000-000000000007', 'aaaa0001-0000-0000-0000-000000000001', NULL, 'service', 'Service 2000h', 'Större service genomförd', '{"hours": 2000, "type": "major"}'),
  ('eeee0001-0000-0000-0000-000000000008', 'aaaa0001-0000-0000-0000-000000000001', NULL, 'inspection', 'Internbesiktning', 'Intern kontroll av säkerhetsutrustning', '{"result": "approved"}'),
  ('eeee0001-0000-0000-0000-000000000009', 'aaaa0001-0000-0000-0000-000000000001', NULL, 'service', 'Service 2500h', 'Planerad service genomförd', '{"hours": 2500}'),
  ('eeee0001-0000-0000-0000-000000000010', 'aaaa0001-0000-0000-0000-000000000001', NULL, 'gps', 'GPS aktiverad', 'Tramigo GPS-enhet installerad och aktiverad', '{"device": "tramigo_t23"}'),
  ('eeee0001-0000-0000-0000-000000000011', 'aaaa0001-0000-0000-0000-000000000001', NULL, 'verification', 'Verifiering genomförd', 'Maskinidentitet verifierad via MachIndex', '{"method": "visual_inspection", "verified_by": "service_tech"}')
ON CONFLICT (id) DO NOTHING;

-- GPS device for Scenario A (simulated - tables may not exist yet)
-- This will be handled by the MII trigger checking latitude/longitude on the machine

-- Machine verification for Scenario A (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'machine_verifications') THEN
    INSERT INTO public.machine_verifications (id, machine_id, verified_by, method, status, completed_at)
    VALUES ('vvvv0001-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000001', NULL, 'visual_inspection', 'completed', NOW() - INTERVAL '30 days')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- SCENARIO B: Minimal machine with L1 trust (target: trust_score ~32, mii_level L1)
-- Machine: aaaa0004-0000-0000-0000-000000000003 (Bobcat E85)
-- Has basic fields filled but no documents
-- -----------------------------------------------------------------------------

-- No additional documents or events for Scenario B - it stays minimal

-- -----------------------------------------------------------------------------
-- SCENARIO C: Mid-tier machine with L3 trust and ownership history (target: trust_score ~78)
-- Machine: aaaa0003-0000-0000-0000-000000000001 (John Deere 6R)
-- Has documents, some events, GPS, but missing verification
-- 2 previous owners
-- -----------------------------------------------------------------------------

-- Documents for Scenario C
INSERT INTO public.documents (id, machine_id, org_id, document_type, title, file_path, file_size_bytes, mime_type, tags, metadata)
VALUES
  ('dddd0003-0000-0000-0000-000000000001', 'aaaa0003-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003', 'purchase_contract', 'Köpeavtal JD 6R 250', 'demo/scenario-c/purchase.pdf', 198000, 'application/pdf', ARRAY['kontrakt'], '{}'),
  ('dddd0003-0000-0000-0000-000000000002', 'aaaa0003-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003', 'photo', 'Traktorbild', 'demo/scenario-c/photo1.jpg', 1100000, 'image/jpeg', ARRAY['foto'], '{}'),
  ('dddd0003-0000-0000-0000-000000000003', 'aaaa0003-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003', 'service_protocol', 'Servicehistorik', 'demo/scenario-c/service.pdf', 145000, 'application/pdf', ARRAY['service'], '{}')
ON CONFLICT (id) DO NOTHING;

-- Events for Scenario C
INSERT INTO public.machine_events (id, machine_id, actor_user_id, event_type, title, description, metadata)
VALUES
  ('eeee0003-0000-0000-0000-000000000001', 'aaaa0003-0000-0000-0000-000000000001', NULL, 'ownership_transfer', 'Ägarövergång', 'Maskin överförd till Österlen Lantbruk', '{"from_org": "Skånes Maskinhandel AB"}'),
  ('eeee0003-0000-0000-0000-000000000002', 'aaaa0003-0000-0000-0000-000000000001', NULL, 'service', 'Årsservice', 'Årsservice genomförd', '{"hours": 1500}'),
  ('eeee0003-0000-0000-0000-000000000003', 'aaaa0003-0000-0000-0000-000000000001', NULL, 'repair', 'Kopplingsreparation', 'Kraftuttagskoppling bytt', '{}'),
  ('eeee0003-0000-0000-0000-000000000004', 'aaaa0003-0000-0000-0000-000000000001', NULL, 'document', 'Dokument tillagt', 'Servicehistorik uppladdad', '{}'),
  ('eeee0003-0000-0000-0000-000000000005', 'aaaa0003-0000-0000-0000-000000000001', NULL, 'gps', 'GPS installerat', 'GPS-spårning aktiverad', '{}')
ON CONFLICT (id) DO NOTHING;

-- Ownership history for Scenario C (2 previous owners)
-- Create temporary orgs for historical owners
INSERT INTO public.organizations (id, name, org_number, country, logo_url, timezone, org_type)
VALUES
  ('99990001-0000-0000-0000-000000000001', 'Lantmännen Maskin AB (historisk)', '556123-9999', 'SE', NULL, 'Europe/Stockholm', 'machine_owner'),
  ('99990001-0000-0000-0000-000000000002', 'Skånes Maskinhandel AB (historisk)', '556234-8888', 'SE', NULL, 'Europe/Stockholm', 'machine_owner')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ownership_history (id, machine_id, org_id, from_date, to_date, transfer_method)
VALUES
  -- Original owner (Lantmännen Maskin AB)
  ('oooo0001-0000-0000-0000-000000000001', 'aaaa0003-0000-0000-0000-000000000001', '99990001-0000-0000-0000-000000000001', '2022-03-15', '2023-06-20', 'manual'),
  -- Second owner (Skånes Maskinhandel AB)
  ('oooo0001-0000-0000-0000-000000000002', 'aaaa0003-0000-0000-0000-000000000001', '99990001-0000-0000-0000-000000000002', '2023-06-20', '2024-01-10', 'freja'),
  -- Current owner (Österlen Lantbruk)
  ('oooo0001-0000-0000-0000-000000000003', 'aaaa0003-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003', '2024-01-10', NULL, 'bankid')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 4. DATA SHARING CONSENTS (15 total)
-- =============================================================================

-- Consents from machine owners to finance/insurance/leasing/service partners
INSERT INTO public.data_sharing_consents (id, customer_org_id, viewer_org_id, viewer_type, consent_level, purpose, granted_at, expires_at)
VALUES
  -- Svensson Bygg -> Finance & Insurance (3)
  ('cccc0001-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'finance', 3, 'Maskinfinansiering', NOW() - INTERVAL '90 days', NOW() + INTERVAL '275 days'),
  ('cccc0001-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'insurance', 2, 'Försäkringsunderlag', NOW() - INTERVAL '60 days', NOW() + INTERVAL '305 days'),
  ('cccc0001-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', 'service_partner', 1, 'Serviceplanering', NOW() - INTERVAL '30 days', NOW() + INTERVAL '335 days'),

  -- Nordic Logistics -> Finance & Insurance (3)
  ('cccc0002-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', 'finance', 3, 'Leasingavtal truckar', NOW() - INTERVAL '120 days', NOW() + INTERVAL '245 days'),
  ('cccc0002-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000002', 'insurance', 2, 'Truckförsäkring', NOW() - INTERVAL '45 days', NOW() + INTERVAL '320 days'),
  ('cccc0002-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000001', 'leasing', 3, 'Leasinguppföljning', NOW() - INTERVAL '150 days', NOW() + INTERVAL '215 days'),

  -- Österlen Lantbruk -> Finance & Insurance & Service (4)
  ('cccc0003-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000003', 'finance', 2, 'Finansiering lantbruksmaskiner', NOW() - INTERVAL '180 days', NOW() + INTERVAL '185 days'),
  ('cccc0003-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000003', 'insurance', 2, 'Lantbruksförsäkring', NOW() - INTERVAL '200 days', NOW() + INTERVAL '165 days'),
  ('cccc0003-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003', '55555555-0000-0000-0000-000000000002', 'service_partner', 1, 'Traktorsservice', NOW() - INTERVAL '15 days', NOW() + INTERVAL '350 days'),
  ('cccc0003-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000003', '44444444-0000-0000-0000-000000000002', 'leasing', 3, 'Leasing skördetröska', NOW() - INTERVAL '100 days', NOW() + INTERVAL '265 days'),

  -- Malmö Entreprenad -> Insurance & Service (2)
  ('cccc0004-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000004', '33333333-0000-0000-0000-000000000001', 'insurance', 2, 'Maskinförsäkring', NOW() - INTERVAL '75 days', NOW() + INTERVAL '290 days'),
  ('cccc0004-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000004', '55555555-0000-0000-0000-000000000001', 'service_partner', 1, 'Serviceavtal', NOW() - INTERVAL '20 days', NOW() + INTERVAL '345 days'),

  -- Maskinuthyrning Norr -> Finance & Insurance & Leasing (3)
  ('cccc0005-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000001', 'finance', 3, 'Flottfinansiering', NOW() - INTERVAL '240 days', NOW() + INTERVAL '125 days'),
  ('cccc0005-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000005', '33333333-0000-0000-0000-000000000002', 'insurance', 3, 'Uthyrningsförsäkring', NOW() - INTERVAL '300 days', NOW() + INTERVAL '65 days'),
  ('cccc0005-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000001', 'leasing', 2, 'Flottleasing', NOW() - INTERVAL '180 days', NOW() + INTERVAL '185 days')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 5. ADDITIONAL DOCUMENTS FOR L2+ MACHINES
-- =============================================================================

-- Add some documents to other machines to reach L2+ levels
INSERT INTO public.documents (id, machine_id, org_id, document_type, title, file_path, file_size_bytes, mime_type, tags, metadata)
VALUES
  -- Org 1: More documents
  ('dddd0100-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'purchase_contract', 'Köpeavtal CAT 330', 'demo/org1/m2_purchase.pdf', 210000, 'application/pdf', ARRAY['kontrakt'], '{}'),
  ('dddd0100-0000-0000-0000-000000000002', 'aaaa0001-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 'service_protocol', 'Servicebok EC220E', 'demo/org1/m3_service.pdf', 156000, 'application/pdf', ARRAY['service'], '{}'),
  ('dddd0100-0000-0000-0000-000000000003', 'aaaa0001-0000-0000-0000-000000000009', '11111111-0000-0000-0000-000000000001', 'insurance_policy', 'Försäkring L90H', 'demo/org1/m9_insurance.pdf', 145000, 'application/pdf', ARRAY['försäkring'], '{}'),
  ('dddd0100-0000-0000-0000-000000000004', 'aaaa0001-0000-0000-0000-000000000015', '11111111-0000-0000-0000-000000000001', 'photo', 'Dumper A30G foto', 'demo/org1/m15_photo.jpg', 980000, 'image/jpeg', ARRAY['foto'], '{}'),

  -- Org 2: Forklift documents
  ('dddd0200-0000-0000-0000-000000000001', 'aaaa0002-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', 'inspection_cert', 'Besiktningsprotokoll', 'demo/org2/m1_inspection.pdf', 120000, 'application/pdf', ARRAY['besiktning'], '{}'),
  ('dddd0200-0000-0000-0000-000000000002', 'aaaa0002-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', 'service_protocol', 'Servicehistorik Linde E30', 'demo/org2/m3_service.pdf', 135000, 'application/pdf', ARRAY['service'], '{}'),

  -- Org 3: Agricultural documents
  ('dddd0300-0000-0000-0000-000000000001', 'aaaa0003-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000003', 'purchase_contract', 'Köpeavtal Fendt 724', 'demo/org3/m2_purchase.pdf', 198000, 'application/pdf', ARRAY['kontrakt'], '{}'),
  ('dddd0300-0000-0000-0000-000000000002', 'aaaa0003-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000003', 'insurance_policy', 'Försäkring Claas Lexion', 'demo/org3/m7_insurance.pdf', 167000, 'application/pdf', ARRAY['försäkring'], '{}'),

  -- Org 4: Some basic docs
  ('dddd0400-0000-0000-0000-000000000001', 'aaaa0004-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000004', 'photo', 'Minigrävare foto', 'demo/org4/m1_photo.jpg', 850000, 'image/jpeg', ARRAY['foto'], '{}'),

  -- Org 5: Rental fleet docs
  ('dddd0500-0000-0000-0000-000000000001', 'aaaa0005-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000005', 'rental_agreement', 'Uthyrningsavtal mall', 'demo/org5/rental_template.pdf', 98000, 'application/pdf', ARRAY['uthyrning'], '{}')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 6. MACHINE EVENTS FOR OTHER MACHINES
-- =============================================================================

-- Add some events to boost history scores for various machines
INSERT INTO public.machine_events (id, machine_id, actor_user_id, event_type, title, description, metadata)
VALUES
  -- Org 1 events
  ('eeee0100-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000002', NULL, 'service', 'Service 3000h', 'Planerad service', '{"hours": 3000}'),
  ('eeee0100-0000-0000-0000-000000000002', 'aaaa0001-0000-0000-0000-000000000002', NULL, 'inspection', 'Årsbesiktning', 'Godkänd', '{}'),
  ('eeee0100-0000-0000-0000-000000000003', 'aaaa0001-0000-0000-0000-000000000009', NULL, 'service', 'Service 3500h', 'Större service', '{"hours": 3500}'),
  ('eeee0100-0000-0000-0000-000000000004', 'aaaa0001-0000-0000-0000-000000000015', NULL, 'repair', 'Däckbyte', 'Alla däck bytta', '{}'),

  -- Org 2 events
  ('eeee0200-0000-0000-0000-000000000001', 'aaaa0002-0000-0000-0000-000000000001', NULL, 'inspection', 'Truckbesiktning', 'Årlig kontroll godkänd', '{}'),
  ('eeee0200-0000-0000-0000-000000000002', 'aaaa0002-0000-0000-0000-000000000003', NULL, 'service', 'Batteriservice', 'Batterikontroll och laddning', '{}'),
  ('eeee0200-0000-0000-0000-000000000003', 'aaaa0002-0000-0000-0000-000000000014', NULL, 'delivery', 'Leverans', 'Ny maskin levererad', '{}'),

  -- Org 3 events
  ('eeee0300-0000-0000-0000-000000000001', 'aaaa0003-0000-0000-0000-000000000002', NULL, 'service', 'Vinterservice', 'Förberedelse för säsong', '{}'),
  ('eeee0300-0000-0000-0000-000000000002', 'aaaa0003-0000-0000-0000-000000000007', NULL, 'service', 'Skördesäsongsservice', 'Service inför skörd', '{}'),

  -- Org 5 events
  ('eeee0500-0000-0000-0000-000000000001', 'aaaa0005-0000-0000-0000-000000000001', NULL, 'rental', 'Uthyrd', 'Uthyrd till kund', '{}'),
  ('eeee0500-0000-0000-0000-000000000002', 'aaaa0005-0000-0000-0000-000000000001', NULL, 'return', 'Återlämnad', 'Återlämnad i gott skick', '{}')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 7. RECALCULATE MII AND TRUST SCORES
-- =============================================================================

-- Trigger recalculation for all machines after seed data is inserted
DO $$
DECLARE
  r record;
BEGIN
  -- Check if the recalc function exists
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'recalc_machine_mii_and_trust'
  ) THEN
    FOR r IN SELECT id FROM public.machines LOOP
      PERFORM public.recalc_machine_mii_and_trust(r.id);
    END LOOP;
    RAISE NOTICE 'MII and trust scores recalculated for all machines';
  ELSE
    RAISE NOTICE 'recalc_machine_mii_and_trust function not found - scores will be default';
  END IF;
END $$;

-- =============================================================================
-- 8. VERIFICATION DATA
-- =============================================================================

SELECT
  'Organizations' as entity,
  count(*) as count
FROM public.organizations
UNION ALL
SELECT
  'Machines' as entity,
  count(*) as count
FROM public.machines
UNION ALL
SELECT
  'Documents' as entity,
  count(*) as count
FROM public.documents WHERE deleted_at IS NULL
UNION ALL
SELECT
  'Machine Events' as entity,
  count(*) as count
FROM public.machine_events
UNION ALL
SELECT
  'Ownership History' as entity,
  count(*) as count
FROM public.ownership_history
UNION ALL
SELECT
  'Data Sharing Consents' as entity,
  count(*) as count
FROM public.data_sharing_consents;

-- =============================================================================
-- MANUAL STEPS (after running this seed)
-- =============================================================================
--
-- 1. Create demo users in Supabase Auth Dashboard:
--    - demo-owner@machindex.se (password: Demo2024!)
--    - demo-admin@machindex.se (password: Demo2024!)
--    - demo-member@machindex.se (password: Demo2024!)
--
-- 2. After users are created, link them to organizations:
--
--    -- Get user IDs from auth.users
--    SELECT id, email FROM auth.users WHERE email LIKE 'demo-%';
--
--    -- Insert profiles (replace USER_ID placeholders)
--    INSERT INTO public.profiles (user_id, display_name, experience_role, language, onboarding_completed_at)
--    VALUES
--      ('USER_ID_OWNER', 'Demo Ägare', 'machine_owner', 'sv', NOW()),
--      ('USER_ID_ADMIN', 'Demo Admin', 'machine_owner', 'sv', NOW()),
--      ('USER_ID_MEMBER', 'Demo Medlem', 'machine_owner', 'sv', NOW());
--
--    -- Link to organization (Svensson Bygg)
--    INSERT INTO public.organization_members (org_id, user_id)
--    VALUES
--      ('11111111-0000-0000-0000-000000000001', 'USER_ID_OWNER'),
--      ('11111111-0000-0000-0000-000000000001', 'USER_ID_ADMIN'),
--      ('11111111-0000-0000-0000-000000000001', 'USER_ID_MEMBER');
--
--    -- Assign roles
--    INSERT INTO public.user_roles (user_id, org_id, role)
--    VALUES
--      ('USER_ID_OWNER', '11111111-0000-0000-0000-000000000001', 'owner'),
--      ('USER_ID_ADMIN', '11111111-0000-0000-0000-000000000001', 'admin'),
--      ('USER_ID_MEMBER', '11111111-0000-0000-0000-000000000001', 'member');
--
-- 3. Verify scenarios:
--    SELECT id, name, mii_level, trust_score
--    FROM public.machines
--    WHERE id IN (
--      'aaaa0001-0000-0000-0000-000000000001', -- Scenario A (should be L4, ~94)
--      'aaaa0004-0000-0000-0000-000000000003', -- Scenario B (should be L1, ~32)
--      'aaaa0003-0000-0000-0000-000000000001'  -- Scenario C (should be L3, ~78)
--    );
--
-- =============================================================================

import type { MiiLevel, TrustBreakdown } from "./database";

export type MachineStatus = "active" | "inactive" | "sold" | "scrapped";

export interface MachineRow {
  id: string;
  org_id: string;
  owner_user_id: string | null;
  name: string;
  type: string | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  serial_number: string | null;
  registration_number: string | null;
  status: MachineStatus;
  trust_score: number;
  trust_breakdown: TrustBreakdown | null;
  verification_level: number;
  mii_level: MiiLevel;
  machindex_id: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  last_gps_update: string | null;
  operating_hours: number;
  next_service_hours: number | null;
  estimated_residual_value: number | null;
  created_at: string;
  updated_at: string;
}

export interface NormalizedMachine {
  id: string;
  orgId: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  serialNumber: string;
  category: string;
  status: MachineStatus;
  trustScore: number;
  trustBreakdown: TrustBreakdown | null;
  verificationLevel: number;
  miiLevel: MiiLevel;
  machindexId: string | null;
  gpsConnected: boolean;
  lastPosition?: { lat: number; lng: number };
  lastGpsUpdate: string | null;
  operatingHours: number;
  imageUrl: string | null;
  createdAt: string;
}

export function normalizeMachine(m: MachineRow): NormalizedMachine {
  return {
    id: m.id,
    orgId: m.org_id,
    name: m.name,
    brand: m.brand ?? "",
    model: m.model ?? "",
    year: m.year ?? 0,
    serialNumber: m.serial_number ?? "",
    category: m.type ?? "other",
    status: m.status,
    trustScore: m.trust_score,
    trustBreakdown: m.trust_breakdown,
    verificationLevel: m.verification_level,
    miiLevel: m.mii_level,
    machindexId: m.machindex_id,
    gpsConnected: !!(m.latitude && m.longitude && m.last_gps_update),
    lastPosition:
      m.latitude && m.longitude ? { lat: m.latitude, lng: m.longitude } : undefined,
    lastGpsUpdate: m.last_gps_update,
    operatingHours: m.operating_hours,
    imageUrl: m.image_url,
    createdAt: m.created_at,
  };
}

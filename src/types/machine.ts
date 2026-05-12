import type { MiiLevel } from "./database";

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
  trust_breakdown: Record<string, number> | null;
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
  name: string;
  brand: string;
  model: string;
  year: number;
  serialNumber: string;
  category: string;
  status: MachineStatus;
  trustScore: number;
  verificationLevel: number;
  miiLevel: MiiLevel;
  machindexId: string | null;
  gpsConnected: boolean;
  lastPosition?: { lat: number; lng: number };
  operatingHours: number;
  imageUrl: string | null;
  createdAt: string;
}

export function normalizeMachine(m: MachineRow): NormalizedMachine {
  return {
    id: m.id,
    name: m.name,
    brand: m.brand ?? "",
    model: m.model ?? "",
    year: m.year ?? 0,
    serialNumber: m.serial_number ?? "",
    category: m.type ?? "other",
    status: m.status,
    trustScore: m.trust_score,
    verificationLevel: m.verification_level,
    miiLevel: m.mii_level,
    machindexId: m.machindex_id,
    gpsConnected: !!(m.latitude && m.longitude && m.last_gps_update),
    lastPosition:
      m.latitude && m.longitude ? { lat: m.latitude, lng: m.longitude } : undefined,
    operatingHours: m.operating_hours,
    imageUrl: m.image_url,
    createdAt: m.created_at,
  };
}

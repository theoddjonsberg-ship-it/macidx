import {
  Building2,
  UserPlus,
  UserMinus,
  ShieldCheck,
  Shield,
  ShieldOff,
  UserCog,
  Activity,
  type LucideIcon,
} from "lucide-react";

export interface EventDescription {
  label: string;
  icon: LucideIcon;
}

export function describeEvent(action: string, entityType: string): EventDescription {
  const key = `${action}:${entityType}`;
  switch (key) {
    case "insert:organizations":
      return { label: "Organisation skapad", icon: Building2 };
    case "update:organizations":
      return { label: "Organisation uppdaterad", icon: Building2 };
    case "insert:organization_members":
      return { label: "Medlem tillagd", icon: UserPlus };
    case "delete:organization_members":
      return { label: "Medlem borttagen", icon: UserMinus };
    case "insert:user_roles":
      return { label: "Behörighet tilldelad", icon: ShieldCheck };
    case "update:user_roles":
      return { label: "Behörighet uppdaterad", icon: Shield };
    case "delete:user_roles":
      return { label: "Behörighet borttagen", icon: ShieldOff };
    case "insert:profiles":
      return { label: "Profil skapad", icon: UserCog };
    case "update:profiles":
      return { label: "Profil uppdaterad", icon: UserCog };
    default:
      return { label: "Systemhändelse", icon: Activity };
  }
}

export const ACTION_OPTIONS = [
  { value: "", label: "Alla händelser" },
  { value: "insert", label: "Skapad" },
  { value: "update", label: "Uppdaterad" },
  { value: "delete", label: "Borttagen" },
] as const;

export const ENTITY_TYPE_OPTIONS = [
  { value: "", label: "Alla objekt" },
  { value: "organizations", label: "Organisation" },
  { value: "organization_members", label: "Medlem" },
  { value: "user_roles", label: "Behörighet" },
  { value: "profiles", label: "Profil" },
] as const;

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

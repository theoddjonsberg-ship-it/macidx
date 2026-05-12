import {
  Shovel,
  Tractor,
  Truck,
  Construction,
  Forklift,
  HardHat,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import type { MachineStatus } from "@/types/machine";
import type { MiiLevel } from "@/types/database";

// Category → Icon mapping
const categoryIconMap: Record<string, LucideIcon> = {
  excavator: Shovel,
  gravmaskin: Shovel,
  wheel_loader: Tractor,
  hjullastare: Tractor,
  lastare: Tractor,
  tractor: Tractor,
  traktor: Tractor,
  dumper: Truck,
  crane: Construction,
  kran: Construction,
  telehandler: Forklift,
  teleskoplastare: Forklift,
  forklift: Forklift,
  truck: Forklift,
  compactor: HardHat,
  valt: HardHat,
  other: Construction,
};

export function getCategoryIcon(category: string | null | undefined): LucideIcon {
  if (!category) return HelpCircle;
  return (
    categoryIconMap[category] ?? categoryIconMap[category.toLowerCase()] ?? HelpCircle
  );
}

// Category labels (Swedish)
const categoryLabels: Record<string, string> = {
  excavator: "Grävmaskin",
  gravmaskin: "Grävmaskin",
  wheel_loader: "Hjullastare",
  hjullastare: "Hjullastare",
  lastare: "Lastare",
  tractor: "Traktor",
  traktor: "Traktor",
  dumper: "Dumper",
  crane: "Kran",
  kran: "Kran",
  telehandler: "Teleskoplastare",
  teleskoplastare: "Teleskoplastare",
  forklift: "Truck",
  truck: "Truck",
  compactor: "Vält",
  valt: "Vält",
  other: "Övrigt",
};

export function getCategoryLabel(category: string | null | undefined): string {
  if (!category) return "Okänd kategori";
  if (categoryLabels[category]) return categoryLabels[category];
  if (categoryLabels[category.toLowerCase()]) return categoryLabels[category.toLowerCase()];
  const cleaned = category.replace(/[-_]+/g, " ").trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

// Status labels (Swedish)
export const statusLabels: Record<MachineStatus, string> = {
  active: "Aktiv",
  inactive: "Inaktiv",
  sold: "Såld",
  scrapped: "Skrotad",
};

// MII level labels
export const miiLevelLabels: Record<MiiLevel, string> = {
  L0: "L0 — Obekräftad",
  L1: "L1 — Grundverifierad",
  L2: "L2 — Korsverifierad",
  L3: "L3 — Ägarverifierad",
  L4: "L4 — Fullständigt verifierad",
};

// Status chip colors
export const statusChipStyles: Record<MachineStatus, string> = {
  active: "border-primary/30 bg-primary/10 text-primary",
  inactive: "border-border bg-muted text-muted-foreground",
  sold: "border-muted-foreground/30 bg-muted text-muted-foreground",
  scrapped: "border-destructive/30 bg-destructive/10 text-destructive",
};

// Trust score color
export function trustTone(score: number): string {
  if (score >= 70) return "text-primary";
  if (score >= 40) return "text-warning";
  return "text-muted-foreground";
}

// MII level badge color
export function miiLevelTone(level: MiiLevel): string {
  switch (level) {
    case "L4":
      return "bg-primary/15 text-primary border-primary/30";
    case "L3":
      return "bg-primary/10 text-primary border-primary/20";
    case "L2":
      return "bg-warning/10 text-warning border-warning/30";
    case "L1":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

// Category options for forms
export const categoryOptions = [
  { value: "excavator", label: "Grävmaskin" },
  { value: "wheel_loader", label: "Hjullastare" },
  { value: "dumper", label: "Dumper" },
  { value: "crane", label: "Kran" },
  { value: "telehandler", label: "Teleskoplastare" },
  { value: "forklift", label: "Truck" },
  { value: "compactor", label: "Vält" },
  { value: "tractor", label: "Traktor" },
  { value: "other", label: "Övrigt" },
];

// Fuel type options
export const fuelTypeOptions = [
  { value: "diesel", label: "Diesel" },
  { value: "electric", label: "El" },
  { value: "hybrid", label: "Hybrid" },
  { value: "gasoline", label: "Bensin" },
  { value: "lpg", label: "LPG" },
  { value: "other", label: "Övrigt" },
];

export interface RiskFlag {
  code: string;
  severity: "red" | "yellow" | "green";
  label: string;
}

export interface RiskInput {
  mii_level: string;
  trust_score: number;
  latitude: number | null;
  year: number | null;
  operating_hours: number;
}

export function getRiskFlags(m: RiskInput): RiskFlag[] {
  const flags: RiskFlag[] = [];

  // Verification level check
  if (m.mii_level === "L0" || m.mii_level === "L1") {
    flags.push({ code: "unverified", severity: "red", label: "Otillracklig verifiering" });
  }

  // Trust score check
  if (m.trust_score < 40) {
    flags.push({ code: "low_trust", severity: "red", label: "Lag trust score" });
  } else if (m.trust_score < 70) {
    flags.push({ code: "medium_trust", severity: "yellow", label: "Medel trust score" });
  } else {
    flags.push({ code: "good_trust", severity: "green", label: "God verifieringsniva" });
  }

  // GPS check
  if (!m.latitude) {
    flags.push({ code: "no_gps", severity: "yellow", label: "Ingen positionsspårning" });
  }

  // Operating hours check
  if (m.operating_hours > 10000) {
    flags.push({ code: "high_hours", severity: "yellow", label: "Hoga drifttimmar" });
  }

  // Age check
  if (m.year && m.year < 2015) {
    flags.push({ code: "old_machine", severity: "yellow", label: "Aldre maskin" });
  }

  return flags;
}

export function calculateRiskScore(trust_score: number): {
  score: number;
  level: "low" | "medium" | "high";
} {
  const score = 100 - trust_score;
  const level = score >= 60 ? "high" : score >= 30 ? "medium" : "low";
  return { score, level };
}

export function getRiskLevelColor(level: "low" | "medium" | "high"): string {
  switch (level) {
    case "low":
      return "text-primary";
    case "medium":
      return "text-warning";
    case "high":
      return "text-destructive";
  }
}

export function getRiskLevelLabel(level: "low" | "medium" | "high"): string {
  switch (level) {
    case "low":
      return "Lag risk";
    case "medium":
      return "Medel risk";
    case "high":
      return "Hog risk";
  }
}

export interface RiskFlag {
  code: string;
  severity: "red" | "yellow" | "green";
  label: string;
  ownerTip?: string;
}

export interface RiskInput {
  mii_level: string;
  trust_score: number;
  latitude: number | null;
  year: number | null;
  operating_hours: number;
}

export interface RiskFlagContext extends RiskInput {
  document_count: number;
  event_count: number;
  ownership_transfer_count_24mo: number;
  has_active_credit_lock: boolean;
  has_insurance_doc: boolean;
  has_purchase_agreement: boolean;
  last_service_days_ago: number | null;
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

export function getRiskFlagsExtended(ctx: RiskFlagContext): RiskFlag[] {
  const flags: RiskFlag[] = [];

  // Verification level check
  if (ctx.mii_level === "L0" || ctx.mii_level === "L1") {
    flags.push({
      code: "unverified",
      severity: "red",
      label: "Otillracklig verifiering",
      ownerTip: "Ladda upp serienummerplatta eller registreringsbevis for att oka verifieringsnivan",
    });
  }

  // Trust score check
  if (ctx.trust_score < 40) {
    flags.push({
      code: "low_trust",
      severity: "red",
      label: "Lag trust score",
      ownerTip: "Komplettera maskinprofilen med fler uppgifter och dokument",
    });
  } else if (ctx.trust_score < 70) {
    flags.push({
      code: "medium_trust",
      severity: "yellow",
      label: "Medel trust score",
      ownerTip: "Oka trust score genom att ladda upp servicehistorik eller forsaljningsavtal",
    });
  } else {
    flags.push({
      code: "good_trust",
      severity: "green",
      label: "God verifieringsniva",
    });
  }

  // GPS check
  if (!ctx.latitude) {
    flags.push({
      code: "no_gps",
      severity: "yellow",
      label: "Ingen positionsspårning",
      ownerTip: "Anslut en GPS-tracker for bättre riskprofil och stöldskydd",
    });
  } else {
    flags.push({
      code: "gps_connected",
      severity: "green",
      label: "GPS ansluten",
    });
  }

  // Operating hours check
  if (ctx.operating_hours > 10000) {
    flags.push({
      code: "high_hours",
      severity: "yellow",
      label: "Hoga drifttimmar",
    });
  }

  // Age check
  if (ctx.year && ctx.year < 2015) {
    flags.push({
      code: "old_machine",
      severity: "yellow",
      label: "Aldre maskin",
    });
  }

  // Document check
  if (ctx.document_count === 0) {
    flags.push({
      code: "no_docs",
      severity: "red",
      label: "Inga dokument",
      ownerTip: "Ladda upp kopeavtal, serviceprotokoll eller andra dokument",
    });
  } else if (ctx.document_count < 3) {
    flags.push({
      code: "few_docs",
      severity: "yellow",
      label: "Fa dokument",
      ownerTip: "Fler dokument starker maskinens verifieringsniva",
    });
  } else {
    flags.push({
      code: "docs_ok",
      severity: "green",
      label: "Dokumentation ok",
    });
  }

  // Insurance document check
  if (!ctx.has_insurance_doc) {
    flags.push({
      code: "no_insurance",
      severity: "yellow",
      label: "Inget forsakringsbevis",
      ownerTip: "Ladda upp forsakringsbevis for att visa att maskinen ar forsakrad",
    });
  } else {
    flags.push({
      code: "insured",
      severity: "green",
      label: "Forsakrad",
    });
  }

  // Purchase agreement check
  if (!ctx.has_purchase_agreement) {
    flags.push({
      code: "no_purchase_agreement",
      severity: "yellow",
      label: "Inget kopeavtal",
      ownerTip: "Ladda upp kopeavtal for att styrka agarskapet",
    });
  }

  // Service history check
  if (ctx.last_service_days_ago === null) {
    flags.push({
      code: "no_service_history",
      severity: "yellow",
      label: "Ingen servicehistorik",
      ownerTip: "Lagg till servicehändelser for att visa underhallshistorik",
    });
  } else if (ctx.last_service_days_ago > 365) {
    flags.push({
      code: "overdue_service",
      severity: "red",
      label: "Service forsenad",
      ownerTip: "Senaste service var for over ett ar sedan - registrera nytt servicebesok",
    });
  } else if (ctx.last_service_days_ago > 180) {
    flags.push({
      code: "service_due_soon",
      severity: "yellow",
      label: "Service snart",
    });
  }

  // Ownership history check
  if (ctx.ownership_transfer_count_24mo >= 3) {
    flags.push({
      code: "frequent_transfers",
      severity: "red",
      label: "Manga agarbyton",
    });
  } else if (ctx.ownership_transfer_count_24mo === 2) {
    flags.push({
      code: "some_transfers",
      severity: "yellow",
      label: "Flera agarbyton",
    });
  }

  // Credit lock check
  if (ctx.has_active_credit_lock) {
    flags.push({
      code: "credit_lock",
      severity: "red",
      label: "Kreditlas aktivt",
    });
  }

  // Event count check
  if (ctx.event_count === 0) {
    flags.push({
      code: "no_events",
      severity: "yellow",
      label: "Ingen historik",
      ownerTip: "Registrera händelser som service, besiktningar och reparationer",
    });
  }

  return flags;
}

export function getNextStepsForOwner(flags: RiskFlag[]): string[] {
  return flags
    .filter((f) => f.ownerTip && f.severity !== "green")
    .sort((a, b) => {
      const order = { red: 0, yellow: 1, green: 2 };
      return order[a.severity] - order[b.severity];
    })
    .map((f) => f.ownerTip!)
    .slice(0, 5);
}

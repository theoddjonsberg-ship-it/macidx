import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { MIIBadge } from "@/components/machine/MIIBadge";
import { TrustGauge } from "@/components/machine/TrustGauge";
import { RiskChip } from "@/components/partner/RiskFlagChips";
import { usePartnerCustomers, type PartnerCustomer } from "@/hooks/usePartnerCustomers";
import { usePartnerPortfolio, type PortfolioMachine } from "@/hooks/usePartnerPortfolio";
import { useCreateQuoteDraft } from "@/hooks/useQuoteDrafts";
import {
  getRiskFlags,
  calculateRiskScore,
  getRiskLevelLabel,
  type RiskFlag,
} from "@/lib/risk-flags";
import { cn } from "@/lib/utils";

type Recommendation = "approved" | "conditional" | "rejected";

// =============================================================================
// Progress Bar
// =============================================================================
function ProgressBar({ step }: { step: number }) {
  const steps = [
    { num: 1, label: "Valj kund" },
    { num: 2, label: "Valj maskiner" },
    { num: 3, label: "Risk" },
    { num: 4, label: "Bedomning" },
  ];

  return (
    <div className="flex items-center justify-between mb-6">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors",
                step > s.num && "bg-primary border-primary text-primary-foreground",
                step === s.num && "border-primary text-primary bg-primary/10",
                step < s.num && "border-border text-muted-foreground"
              )}
            >
              {step > s.num ? (
                <Check className="h-4 w-4" strokeWidth={2} />
              ) : (
                s.num
              )}
            </div>
            <span
              className={cn(
                "text-[10px] mt-1 font-medium",
                step >= s.num ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "flex-1 h-0.5 mx-2",
                step > s.num ? "bg-primary" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Step 1: Select Customer
// =============================================================================
function Step1SelectCustomer({
  customers,
  isLoading,
  onSelect,
}: {
  customers: PartnerCustomer[];
  isLoading: boolean;
  onSelect: (c: PartnerCustomer) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.org_name.toLowerCase().includes(q) ||
        c.org_number?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-control" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-medium text-foreground mb-3">Valj kund</h2>

      {customers.length > 3 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          <Input
            type="text"
            placeholder="Sok pa namn eller org-nummer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <Building2 className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">
            {search ? "Inga matchande kunder" : "Inga kunder med aktivt samtycke"}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((customer) => (
            <button
              key={customer.org_id}
              type="button"
              onClick={() => onSelect(customer)}
              className="w-full"
            >
              <Card className="p-4 hover:bg-surface-track transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-control bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {customer.org_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {customer.org_number ?? "—"} · {customer.machine_count} maskiner
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Step 2: Select Machines
// =============================================================================
function Step2SelectMachines({
  machines,
  selected,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: {
  machines: PortfolioMachine[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-foreground">
          {selected.size} av {machines.length} maskiner valda
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onSelectAll}>
            Markera alla
          </Button>
          <Button variant="secondary" size="sm" onClick={onDeselectAll}>
            Avmarkera
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {machines.map((machine) => {
          const isSelected = selected.has(machine.id);
          const flags = getRiskFlags({
            mii_level: machine.mii_level,
            trust_score: machine.trust_score,
            latitude: machine.latitude,
            year: machine.year,
            operating_hours: machine.operating_hours,
          });

          return (
            <button
              key={machine.id}
              type="button"
              onClick={() => onToggle(machine.id)}
              className="w-full"
            >
              <Card
                className={cn(
                  "p-3 transition-colors text-left",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "hover:bg-surface-track"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0",
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-border"
                    )}
                  >
                    {isSelected && (
                      <Check className="h-3 w-3 text-primary-foreground" strokeWidth={2} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {machine.brand} {machine.model}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {machine.serial_number ? `...${machine.serial_number.slice(-4)}` : "—"}
                    </p>
                  </div>

                  <MIIBadge level={machine.mii_level} />
                  <TrustGauge score={machine.trust_score} size="sm" />

                  <div className="hidden sm:flex items-center gap-1">
                    {flags.slice(0, 2).map((flag, i) => (
                      <RiskChip key={i} flag={flag} />
                    ))}
                  </div>
                </div>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Step 3: Risk Summary
// =============================================================================
function Step3RiskSummary({
  machines,
  selectedIds,
}: {
  machines: PortfolioMachine[];
  selectedIds: Set<string>;
}) {
  const selectedMachines = machines.filter((m) => selectedIds.has(m.id));

  const summary = useMemo(() => {
    let totalTrust = 0;
    let totalFlags = 0;
    const allFlags: RiskFlag[] = [];

    selectedMachines.forEach((m) => {
      totalTrust += m.trust_score;
      const flags = getRiskFlags({
        mii_level: m.mii_level,
        trust_score: m.trust_score,
        latitude: m.latitude,
        year: m.year,
        operating_hours: m.operating_hours,
      });
      allFlags.push(...flags);
      totalFlags += flags.filter((f) => f.severity !== "green").length;
    });

    return {
      count: selectedMachines.length,
      avgTrust: Math.round(totalTrust / selectedMachines.length),
      totalFlags,
    };
  }, [selectedMachines]);

  return (
    <div>
      <h2 className="text-sm font-medium text-foreground mb-3">Risksammanfattning</h2>

      {/* Summary Card */}
      <Card className="p-4 mb-4 bg-muted/20">
        <div className="flex items-center justify-around text-center">
          <div>
            <p className="text-2xl font-semibold text-foreground">{summary.count}</p>
            <p className="text-xs text-muted-foreground">maskiner</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p
              className={cn(
                "text-2xl font-semibold",
                summary.avgTrust >= 70
                  ? "text-primary"
                  : summary.avgTrust >= 50
                  ? "text-warning"
                  : "text-destructive"
              )}
            >
              {summary.avgTrust}
            </p>
            <p className="text-xs text-muted-foreground">snitt trust</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p
              className={cn(
                "text-2xl font-semibold",
                summary.totalFlags === 0
                  ? "text-primary"
                  : summary.totalFlags <= 3
                  ? "text-warning"
                  : "text-destructive"
              )}
            >
              {summary.totalFlags}
            </p>
            <p className="text-xs text-muted-foreground">varningar</p>
          </div>
        </div>
      </Card>

      {/* Per-machine breakdown */}
      <div className="space-y-3">
        {selectedMachines.map((machine) => {
          const flags = getRiskFlags({
            mii_level: machine.mii_level,
            trust_score: machine.trust_score,
            latitude: machine.latitude,
            year: machine.year,
            operating_hours: machine.operating_hours,
          });
          const { level } = calculateRiskScore(machine.trust_score);

          return (
            <Card key={machine.id} className="p-4">
              <div className="flex items-start gap-3">
                <TrustGauge score={machine.trust_score} size="md" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">
                      {machine.brand} {machine.model}
                    </p>
                    <MIIBadge level={machine.mii_level} />
                  </div>

                  <div className="text-xs text-muted-foreground mt-1">
                    {machine.year && <span>Arsmodell {machine.year}</span>}
                    {machine.year && machine.operating_hours > 0 && <span> · </span>}
                    {machine.operating_hours > 0 && (
                      <span>{machine.operating_hours.toLocaleString()} tim</span>
                    )}
                    {machine.serial_number && (
                      <span> · SN: ...{machine.serial_number.slice(-4)}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {flags.map((flag, i) => (
                      <RiskChip key={i} flag={flag} />
                    ))}
                  </div>
                </div>

                <div
                  className={cn(
                    "px-2 py-1 rounded-control text-xs font-medium",
                    level === "low" && "bg-primary/10 text-primary",
                    level === "medium" && "bg-warning/10 text-warning",
                    level === "high" && "bg-destructive/10 text-destructive"
                  )}
                >
                  {getRiskLevelLabel(level)}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Step 4: Assessment
// =============================================================================
function Step4Assessment({
  analysisText,
  setAnalysisText,
  recommendation,
  setRecommendation,
}: {
  analysisText: string;
  setAnalysisText: (v: string) => void;
  recommendation: Recommendation | null;
  setRecommendation: (r: Recommendation) => void;
}) {
  const options: { value: Recommendation; label: string; icon: typeof CheckCircle; color: string }[] = [
    { value: "approved", label: "Godkann", icon: CheckCircle, color: "text-primary" },
    { value: "conditional", label: "Villkorat godkannande", icon: HelpCircle, color: "text-warning" },
    { value: "rejected", label: "Avsla", icon: XCircle, color: "text-destructive" },
  ];

  return (
    <div>
      <h2 className="text-sm font-medium text-foreground mb-3">Din bedomning</h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="analysis" className="text-xs text-muted-foreground block mb-1">
            Analys och slutsats
          </label>
          <textarea
            id="analysis"
            value={analysisText}
            onChange={(e) => setAnalysisText(e.target.value)}
            placeholder="Beskriv analys och slutsats..."
            rows={5}
            className="w-full px-3 py-2 text-sm rounded-control border border-border bg-surface-track focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Rekommendation</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = recommendation === opt.value;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRecommendation(opt.value)}
                  className={cn(
                    "p-3 rounded-control border-2 text-left transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-surface-track"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-5 w-5", opt.color)} strokeWidth={1.75} />
                    <span className="text-sm font-medium text-foreground">{opt.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================
export function QuoteWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<PartnerCustomer | null>(null);
  const [selectedMachines, setSelectedMachines] = useState<Set<string>>(new Set());
  const [analysisText, setAnalysisText] = useState("");
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { data: customers, isLoading: customersLoading } = usePartnerCustomers();
  const { data: portfolio } = usePartnerPortfolio();
  const createQuote = useCreateQuoteDraft();

  const customerMachines = useMemo(() => {
    if (!selectedCustomer || !portfolio) return [];
    return portfolio.filter((m) => m.org_id === selectedCustomer.org_id);
  }, [selectedCustomer, portfolio]);

  const handleSelectCustomer = (customer: PartnerCustomer) => {
    setSelectedCustomer(customer);
    setSelectedMachines(new Set());
    setStep(2);
  };

  const handleToggleMachine = (id: string) => {
    setSelectedMachines((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedMachines(new Set(customerMachines.map((m) => m.id)));
  };

  const handleDeselectAll = () => {
    setSelectedMachines(new Set());
  };

  const buildRiskSnapshot = () => {
    const machines = customerMachines.filter((m) => selectedMachines.has(m.id));
    return {
      machine_count: machines.length,
      avg_trust: Math.round(
        machines.reduce((sum, m) => sum + m.trust_score, 0) / machines.length
      ),
      machines: machines.map((m) => ({
        id: m.id,
        name: m.name,
        brand: m.brand,
        model: m.model,
        mii_level: m.mii_level,
        trust_score: m.trust_score,
        flags: getRiskFlags({
          mii_level: m.mii_level,
          trust_score: m.trust_score,
          latitude: m.latitude,
          year: m.year,
          operating_hours: m.operating_hours,
        }),
      })),
    };
  };

  const handleSave = async (exportAfter: boolean) => {
    if (!selectedCustomer) return;

    try {
      const result = await createQuote.mutateAsync({
        customer_org_id: selectedCustomer.org_id,
        machine_ids: Array.from(selectedMachines),
        analysis_text: analysisText || null,
        recommendation,
        risk_snapshot: buildRiskSnapshot(),
      });

      if (exportAfter) {
        navigate(`/partner/quotes/${result.id}/report`);
      } else {
        navigate("/partner/quotes");
      }
    } catch {
      // Error handled by mutation
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!selectedCustomer;
      case 2:
        return selectedMachines.size > 0;
      case 3:
        return true;
      case 4:
        return !!recommendation;
      default:
        return false;
    }
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" strokeWidth={1.75} />
          <h1 className="text-lg font-semibold text-foreground">Ny offert</h1>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowCancelConfirm(true)}
        >
          Avbryt
        </Button>
      </div>

      {/* Progress */}
      <ProgressBar step={step} />

      {/* Step Content */}
      <div className="min-h-[300px]">
        {step === 1 && (
          <Step1SelectCustomer
            customers={customers ?? []}
            isLoading={customersLoading}
            onSelect={handleSelectCustomer}
          />
        )}

        {step === 2 && (
          <Step2SelectMachines
            machines={customerMachines}
            selected={selectedMachines}
            onToggle={handleToggleMachine}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
          />
        )}

        {step === 3 && (
          <Step3RiskSummary
            machines={customerMachines}
            selectedIds={selectedMachines}
          />
        )}

        {step === 4 && (
          <Step4Assessment
            analysisText={analysisText}
            setAnalysisText={setAnalysisText}
            recommendation={recommendation}
            setRecommendation={setRecommendation}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
        <Button
          variant="secondary"
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" strokeWidth={1.75} />
          Tillbaka
        </Button>

        {step < 4 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
            Nasta
            <ChevronRight className="h-4 w-4 ml-1" strokeWidth={1.75} />
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => handleSave(false)}
              disabled={createQuote.isPending || !canProceed()}
            >
              Spara som draft
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={createQuote.isPending || !canProceed()}
            >
              {createQuote.isPending ? "Sparar..." : "Spara och exportera"}
            </Button>
          </div>
        )}
      </div>

      {/* Cancel Confirmation */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
          <Card className="max-w-sm w-full">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-warning" strokeWidth={1.75} />
              <h3 className="text-sm font-semibold text-foreground">Avbryt offert?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Ar du saker pa att du vill avbryta? Alla anderingar forsvinner.
            </p>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={() => setShowCancelConfirm(false)}>
                Fortsatt
              </Button>
              <Button
                onClick={() => navigate("/partner/customers")}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Avbryt
              </Button>
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

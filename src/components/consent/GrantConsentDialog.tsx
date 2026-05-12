import { useState, useMemo } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Building2,
  BarChart3,
  EyeOff,
  Eye,
  AlertTriangle,
  Clock,
  Check,
  Handshake,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";
import { FormError } from "@/components/ui/FormError";
import { cn } from "@/lib/utils";
import {
  useEligiblePartnerOrgs,
  ORG_TYPE_LABELS,
  type PartnerOrg,
} from "@/hooks/useEligiblePartnerOrgs";
import {
  useGrantConsent,
  calculateExpiresAt,
  CONSENT_LEVEL_OPTIONS,
  DURATION_OPTIONS,
} from "@/hooks/useGrantConsent";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

interface GrantConsentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ConsentLevel = 1 | 2 | 3;
type Duration = "30d" | "90d" | "1y" | "indefinite";

const LEVEL_ICONS = {
  BarChart3,
  EyeOff,
  Eye,
};

export function GrantConsentDialog({ open, onClose, onSuccess }: GrantConsentDialogProps) {
  const [step, setStep] = useState(1);
  const [selectedPartner, setSelectedPartner] = useState<PartnerOrg | null>(null);
  const [consentLevel, setConsentLevel] = useState<ConsentLevel>(2);
  const [purpose, setPurpose] = useState("");
  const [duration, setDuration] = useState<Duration>("90d");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: partnerOrgs, isLoading: partnersLoading } = useEligiblePartnerOrgs();
  const { data: activeOrg } = useActiveOrg();
  const grantConsent = useGrantConsent();

  // Count machines in org
  const { data: machineCount } = useQuery({
    queryKey: ["org-machine-count", activeOrg?.id],
    enabled: !!activeOrg?.id,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("machines")
        .select("*", { count: "exact", head: true })
        .eq("org_id", activeOrg!.id);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const filteredPartners = useMemo(() => {
    if (!partnerOrgs) return [];
    if (!searchQuery.trim()) return partnerOrgs;
    const q = searchQuery.toLowerCase();
    return partnerOrgs.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.org_number?.toLowerCase().includes(q)
    );
  }, [partnerOrgs, searchQuery]);

  const handleSubmit = async () => {
    if (!selectedPartner) return;

    try {
      await grantConsent.mutateAsync({
        viewer_org_id: selectedPartner.id,
        viewer_type: selectedPartner.org_type,
        consent_level: consentLevel,
        purpose: purpose.trim() || null,
        expires_at: calculateExpiresAt(duration),
      });
      onSuccess?.();
      handleClose();
    } catch {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedPartner(null);
    setConsentLevel(2);
    setPurpose("");
    setDuration("90d");
    setSearchQuery("");
    onClose();
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!selectedPartner;
      case 2:
        return !!consentLevel;
      case 3:
        return true; // Purpose is optional
      case 4:
        return !!duration;
      case 5:
        return true;
      default:
        return false;
    }
  };

  if (!open) return null;

  const levelOption = CONSENT_LEVEL_OPTIONS.find((o) => o.level === consentLevel);
  const durationOption = DURATION_OPTIONS.find((o) => o.value === duration);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-primary" strokeWidth={1.75} />
            <h2 className="text-base font-semibold text-foreground">Ge samtycke</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-control hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-1 mb-6">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                s <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="min-h-[280px]">
          {step === 1 && (
            <Step1SelectPartner
              partners={filteredPartners}
              isLoading={partnersLoading}
              selected={selectedPartner}
              onSelect={setSelectedPartner}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          )}

          {step === 2 && (
            <Step2SelectLevel
              selected={consentLevel}
              onSelect={setConsentLevel}
            />
          )}

          {step === 3 && (
            <Step3Purpose
              value={purpose}
              onChange={setPurpose}
            />
          )}

          {step === 4 && (
            <Step4Duration
              selected={duration}
              onSelect={setDuration}
            />
          )}

          {step === 5 && (
            <Step5Confirm
              partner={selectedPartner}
              levelLabel={levelOption?.label ?? ""}
              durationLabel={durationOption?.label ?? ""}
              purpose={purpose}
              machineCount={machineCount ?? 0}
            />
          )}
        </div>

        {/* Error message */}
        {grantConsent.isError && (
          <FormError className="mt-4">
            {grantConsent.error instanceof Error
              ? grantConsent.error.message
              : "Kunde inte skapa samtycke"}
          </FormError>
        )}

        {/* Footer navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <Button
            variant="secondary"
            onClick={() => (step > 1 ? setStep(step - 1) : handleClose())}
            disabled={grantConsent.isPending}
          >
            <ChevronLeft className="h-4 w-4 mr-1" strokeWidth={1.75} />
            {step === 1 ? "Avbryt" : "Tillbaka"}
          </Button>

          {step < 5 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Nästa
              <ChevronRight className="h-4 w-4 ml-1" strokeWidth={1.75} />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={grantConsent.isPending}
            >
              {grantConsent.isPending ? (
                "Skapar samtycke..."
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1.5" strokeWidth={1.75} />
                  Bekräfta och dela
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

// =============================================================================
// Step 1: Select Partner Organization
// =============================================================================
function Step1SelectPartner({
  partners,
  isLoading,
  selected,
  onSelect,
  searchQuery,
  onSearchChange,
}: {
  partners: PartnerOrg[];
  isLoading: boolean;
  selected: PartnerOrg | null;
  onSelect: (p: PartnerOrg) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}) {
  return (
    <div>
      <Label className="text-sm font-medium text-foreground mb-3 block">
        Välj partner-organisation
      </Label>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
        <Input
          type="text"
          placeholder="Sök på namn eller org-nummer..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-2 max-h-[220px] overflow-y-auto">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-control bg-muted/20">
                <Skeleton className="h-9 w-9 rounded-control" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </>
        ) : partners.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "Inga matchande organisationer" : "Inga partner-organisationer tillgängliga"}
            </p>
          </div>
        ) : (
          partners.map((partner) => (
            <button
              key={partner.id}
              type="button"
              onClick={() => onSelect(partner)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-control text-left transition-colors",
                selected?.id === partner.id
                  ? "bg-primary/10 border border-primary"
                  : "bg-muted/10 hover:bg-muted/20 border border-transparent"
              )}
            >
              <div className="h-9 w-9 rounded-control bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-4 w-4 text-primary" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {partner.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    {ORG_TYPE_LABELS[partner.org_type] ?? partner.org_type}
                  </span>
                  {partner.org_number && (
                    <span className="text-[10px] text-muted-foreground">
                      {partner.org_number}
                    </span>
                  )}
                </div>
              </div>
              {selected?.id === partner.id && (
                <Check className="h-4 w-4 text-primary flex-shrink-0" strokeWidth={1.75} />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Step 2: Select Access Level
// =============================================================================
function Step2SelectLevel({
  selected,
  onSelect,
}: {
  selected: ConsentLevel;
  onSelect: (level: ConsentLevel) => void;
}) {
  return (
    <div>
      <Label className="text-sm font-medium text-foreground mb-3 block">
        Välj typ av åtkomst
      </Label>

      <div className="space-y-2">
        {CONSENT_LEVEL_OPTIONS.map((option) => {
          const Icon = LEVEL_ICONS[option.icon as keyof typeof LEVEL_ICONS];
          const isSelected = selected === option.level;

          return (
            <button
              key={option.level}
              type="button"
              onClick={() => onSelect(option.level)}
              className={cn(
                "w-full flex items-start gap-3 p-3 rounded-control text-left transition-colors",
                isSelected
                  ? "bg-primary/10 border border-primary"
                  : "bg-muted/10 hover:bg-muted/20 border border-transparent"
              )}
            >
              <div
                className={cn(
                  "h-9 w-9 rounded-control flex items-center justify-center flex-shrink-0",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{option.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                {option.warning && isSelected && (
                  <div className="flex items-start gap-1.5 mt-2 p-2 rounded bg-warning/10 border border-warning/30">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                    <p className="text-[10px] text-warning leading-tight">{option.warning}</p>
                  </div>
                )}
              </div>
              {isSelected && (
                <Check className="h-4 w-4 text-primary flex-shrink-0 mt-1" strokeWidth={1.75} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Step 3: Purpose (Optional)
// =============================================================================
function Step3Purpose({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label htmlFor="purpose" className="text-sm font-medium text-foreground mb-1 block">
        Syfte (valfritt)
      </Label>
      <p className="text-xs text-muted-foreground mb-3">
        Beskriv syftet med datadelningen. Detta visas i partnerns notifikation.
      </p>

      <textarea
        id="purpose"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 200))}
        placeholder="T.ex. Finansieringsunderlag inför leasing"
        rows={4}
        className="w-full px-3 py-2 text-sm rounded-control border border-border bg-surface-track focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
      />

      <p className="text-[10px] text-muted-foreground mt-1 text-right">
        {value.length}/200 tecken
      </p>
    </div>
  );
}

// =============================================================================
// Step 4: Duration
// =============================================================================
function Step4Duration({
  selected,
  onSelect,
}: {
  selected: Duration;
  onSelect: (d: Duration) => void;
}) {
  return (
    <div>
      <Label className="text-sm font-medium text-foreground mb-3 block">
        Giltighet
      </Label>

      <div className="grid grid-cols-2 gap-2">
        {DURATION_OPTIONS.map((option) => {
          const isSelected = selected === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className={cn(
                "flex items-center justify-center gap-2 p-4 rounded-control text-center transition-colors",
                isSelected
                  ? "bg-primary/10 border border-primary"
                  : "bg-muted/10 hover:bg-muted/20 border border-transparent"
              )}
            >
              <Clock className={cn("h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground")} strokeWidth={1.75} />
              <span className={cn("text-sm font-medium", isSelected ? "text-foreground" : "text-muted-foreground")}>
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Du kan när som helst återkalla samtycket.
      </p>
    </div>
  );
}

// =============================================================================
// Step 5: Confirm
// =============================================================================
function Step5Confirm({
  partner,
  levelLabel,
  durationLabel,
  purpose,
  machineCount,
}: {
  partner: PartnerOrg | null;
  levelLabel: string;
  durationLabel: string;
  purpose: string;
  machineCount: number;
}) {
  if (!partner) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Handshake className="h-5 w-5 text-primary" strokeWidth={1.75} />
        <h3 className="text-sm font-semibold text-foreground">Bekräfta samtycke</h3>
      </div>

      <div className="p-4 rounded-control bg-muted/10 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-control bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5 text-primary" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{partner.name}</p>
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary mt-1">
              {ORG_TYPE_LABELS[partner.org_type] ?? partner.org_type}
            </span>
          </div>
        </div>

        <div className="border-t border-border pt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Åtkomstnivå</span>
            <span className="font-medium text-foreground">{levelLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Maskiner som delas</span>
            <span className="font-medium text-foreground">{machineCount} st</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Giltighet</span>
            <span className="font-medium text-foreground">{durationLabel}</span>
          </div>
          {purpose && (
            <div className="pt-2 border-t border-border">
              <span className="text-muted-foreground text-xs">Syfte:</span>
              <p className="text-sm text-foreground italic mt-0.5">"{purpose}"</p>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Genom att bekräfta ger du {partner.name} tillgång till dina maskindata enligt vald nivå.
      </p>
    </div>
  );
}

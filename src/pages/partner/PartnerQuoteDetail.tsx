import { useParams, Navigate, Link } from "react-router-dom";
import {
  FileText,
  ChevronLeft,
  Building2,
  Download,
  Clock,
  User,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { MIIBadge } from "@/components/machine/MIIBadge";
import { TrustGauge } from "@/components/machine/TrustGauge";
import { RiskChip } from "@/components/partner/RiskFlagChips";
import {
  useQuoteDraft,
  useExportQuoteDraft,
  RECOMMENDATION_LABELS,
  RECOMMENDATION_COLORS,
} from "@/hooks/useQuoteDrafts";
import { cn } from "@/lib/utils";
import type { RiskFlag } from "@/lib/risk-flags";

function LoadingState() {
  return (
    <AppShell>
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-6 w-48" />
      </div>
      <Card className="p-6 mb-6">
        <Skeleton className="h-5 w-32 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </Card>
    </AppShell>
  );
}

export function PartnerQuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: quote, isLoading } = useQuoteDraft(id);
  const exportQuote = useExportQuoteDraft();

  if (isLoading) {
    return <LoadingState />;
  }

  if (!quote) {
    return <Navigate to="/404" replace />;
  }

  const riskSnapshot = quote.risk_snapshot as {
    machine_count?: number;
    avg_trust?: number;
    machines?: Array<{
      id: string;
      name: string;
      brand: string | null;
      model: string | null;
      mii_level: string;
      trust_score: number;
      flags: RiskFlag[];
    }>;
  };

  const handleExport = async () => {
    await exportQuote.mutateAsync(quote.id);
    window.open(`/partner/quotes/${quote.id}/report`, "_blank");
  };

  return (
    <AppShell>
      {/* Back link */}
      <Link
        to="/partner/quotes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
        Tillbaka till offerter
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-control bg-primary/10 flex items-center justify-center">
            <FileText className="h-6 w-6 text-primary" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Offert for {quote.customer_org?.name ?? "Okand kund"}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" strokeWidth={1.75} />
                {new Date(quote.created_at).toLocaleDateString("sv-SE")}
              </span>
              {quote.creator?.display_name && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" strokeWidth={1.75} />
                    {quote.creator.display_name}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport} disabled={exportQuote.isPending}>
            <Download className="h-4 w-4 mr-1.5" strokeWidth={1.75} />
            {exportQuote.isPending ? "Exporterar..." : "Exportera"}
          </Button>
        </div>
      </div>

      {/* Customer Info */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-control bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {quote.customer_org?.name}
            </p>
            {quote.customer_org?.org_number && (
              <p className="text-xs text-muted-foreground">
                {quote.customer_org.org_number}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <Card className="p-4 mb-6 bg-muted/20">
        <div className="flex items-center justify-around text-center">
          <div>
            <p className="text-2xl font-semibold text-foreground">
              {riskSnapshot.machine_count ?? quote.machine_ids.length}
            </p>
            <p className="text-xs text-muted-foreground">maskiner</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p
              className={cn(
                "text-2xl font-semibold",
                (riskSnapshot.avg_trust ?? 0) >= 70
                  ? "text-primary"
                  : (riskSnapshot.avg_trust ?? 0) >= 50
                  ? "text-warning"
                  : "text-destructive"
              )}
            >
              {riskSnapshot.avg_trust ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground">snitt trust</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            {quote.recommendation ? (
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                  RECOMMENDATION_COLORS[quote.recommendation]
                )}
              >
                {RECOMMENDATION_LABELS[quote.recommendation]}
              </span>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">rekommendation</p>
          </div>
        </div>
      </Card>

      {/* Analysis */}
      {quote.analysis_text && (
        <Card className="p-4 mb-6">
          <h3 className="text-sm font-medium text-foreground mb-2">Analys</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {quote.analysis_text}
          </p>
        </Card>
      )}

      {/* Machines */}
      {riskSnapshot.machines && riskSnapshot.machines.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Maskiner ({riskSnapshot.machines.length})
          </h3>
          <div className="space-y-3">
            {riskSnapshot.machines.map((machine) => (
              <Card key={machine.id} className="p-4">
                <div className="flex items-start gap-3">
                  <TrustGauge score={machine.trust_score} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">
                        {machine.brand} {machine.model}
                      </p>
                      <MIIBadge level={machine.mii_level as "L0" | "L1" | "L2" | "L3" | "L4"} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{machine.name}</p>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {machine.flags?.map((flag, i) => (
                        <RiskChip key={i} flag={flag} />
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}

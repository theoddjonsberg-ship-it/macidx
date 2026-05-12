import { useParams, Navigate, Link } from "react-router-dom";
import { ChevronLeft, Printer, Building2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useQuoteDraft, RECOMMENDATION_LABELS } from "@/hooks/useQuoteDrafts";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { cn } from "@/lib/utils";
import type { RiskFlag } from "@/lib/risk-flags";

export function PartnerQuoteReport() {
  const { id } = useParams<{ id: string }>();
  const { data: quote, isLoading } = useQuoteDraft(id);
  const { data: partnerOrg } = useActiveOrg();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Laddar rapport...</p>
      </div>
    );
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Print controls - hidden when printing */}
      <div className="print:hidden sticky top-0 bg-background border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            to={`/partner/quotes/${quote.id}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
            Tillbaka
          </Link>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1.5" strokeWidth={1.75} />
            Skriv ut
          </Button>
        </div>
      </div>

      {/* Report Content */}
      <div className="max-w-4xl mx-auto p-8 print:p-0">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-8 border-b border-border">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Riskbedomning</h1>
            <p className="text-muted-foreground mt-1">
              {new Date(quote.created_at).toLocaleDateString("sv-SE", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-semibold tracking-wider text-foreground">
              MACHINDEX
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {partnerOrg?.name}
            </p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Kund
          </h2>
          <div className="flex items-center gap-3 p-4 bg-muted/10 rounded-lg">
            <Building2 className="h-8 w-8 text-primary" strokeWidth={1.5} />
            <div>
              <p className="text-lg font-semibold text-foreground">
                {quote.customer_org?.name}
              </p>
              {quote.customer_org?.org_number && (
                <p className="text-sm text-muted-foreground">
                  Org.nr: {quote.customer_org.org_number}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Sammanfattning
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-muted/10 rounded-lg text-center">
              <p className="text-3xl font-bold text-foreground">
                {riskSnapshot.machine_count ?? quote.machine_ids.length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Maskiner</p>
            </div>
            <div className="p-4 bg-muted/10 rounded-lg text-center">
              <p
                className={cn(
                  "text-3xl font-bold",
                  (riskSnapshot.avg_trust ?? 0) >= 70
                    ? "text-primary"
                    : (riskSnapshot.avg_trust ?? 0) >= 50
                    ? "text-warning"
                    : "text-destructive"
                )}
              >
                {riskSnapshot.avg_trust ?? "—"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Snitt Trust Score</p>
            </div>
            <div className="p-4 bg-muted/10 rounded-lg text-center">
              {quote.recommendation ? (
                <p
                  className={cn(
                    "text-lg font-bold",
                    quote.recommendation === "approved" && "text-primary",
                    quote.recommendation === "conditional" && "text-warning",
                    quote.recommendation === "rejected" && "text-destructive"
                  )}
                >
                  {RECOMMENDATION_LABELS[quote.recommendation]}
                </p>
              ) : (
                <p className="text-lg font-bold text-muted-foreground">—</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">Rekommendation</p>
            </div>
          </div>
        </div>

        {/* Analysis */}
        {quote.analysis_text && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Analys
            </h2>
            <div className="p-4 bg-muted/10 rounded-lg">
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {quote.analysis_text}
              </p>
            </div>
          </div>
        )}

        {/* Machines Table */}
        {riskSnapshot.machines && riskSnapshot.machines.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Maskiner
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium text-muted-foreground">Maskin</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">MII</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Trust</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Flaggor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {riskSnapshot.machines.map((machine) => (
                  <tr key={machine.id}>
                    <td className="py-3">
                      <p className="font-medium text-foreground">
                        {machine.brand} {machine.model}
                      </p>
                      <p className="text-xs text-muted-foreground">{machine.name}</p>
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-mono">
                        {machine.mii_level}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={cn(
                          "font-mono font-semibold",
                          machine.trust_score >= 70 && "text-primary",
                          machine.trust_score >= 50 && machine.trust_score < 70 && "text-warning",
                          machine.trust_score < 50 && "text-destructive"
                        )}
                      >
                        {machine.trust_score}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {machine.flags?.slice(0, 3).map((flag, i) => (
                          <span
                            key={i}
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border",
                              flag.severity === "red" && "bg-destructive/10 text-destructive border-destructive/30",
                              flag.severity === "yellow" && "bg-warning/10 text-warning border-warning/30",
                              flag.severity === "green" && "bg-primary/10 text-primary border-primary/30"
                            )}
                          >
                            {flag.label}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="pt-8 border-t border-border text-center text-xs text-muted-foreground">
          <p>
            Genererad via MachIndex · {new Date().toLocaleDateString("sv-SE")} ·{" "}
            {partnerOrg?.name}
          </p>
          <p className="mt-1">
            Rapport-ID: {quote.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </div>
    </div>
  );
}

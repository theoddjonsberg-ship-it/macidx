import { useParams, Link, Navigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  ChevronLeft,
  Printer,
  AlertTriangle,
  CheckCircle,
  Info,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMachineReport } from "@/hooks/useMachineReport";
import { formatDate, formatDateTime, formatHours } from "@/lib/format";
import { getCategoryLabel, statusLabels } from "@/lib/machine-utils";
import { getRiskLevelLabel, calculateRiskScore, type RiskFlag } from "@/lib/risk-flags";
import { cn } from "@/lib/utils";

const MII_LABELS: Record<string, string> = {
  L0: "Oidentifierad",
  L1: "Registrerad",
  L2: "Bekraftad",
  L3: "Verifierad",
  L4: "Certifierad",
};

function LoadingState() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-[21cm] mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

export function MachineReport() {
  const { id } = useParams<{ id: string }>();
  const { data: report, isLoading } = useMachineReport(id);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!report) {
    return <Navigate to="/404" replace />;
  }

  const { machine, documents, events, ownershipHistory, riskFlags, currentOwner } = report;
  const { level: riskLevel } = calculateRiskScore(machine.trustScore);
  const reportUrl = `${window.location.origin}/machines/${machine.id}`;

  const handlePrint = () => {
    window.print();
  };

  const redFlags = riskFlags.filter((f) => f.severity === "red");
  const yellowFlags = riskFlags.filter((f) => f.severity === "yellow");
  const greenFlags = riskFlags.filter((f) => f.severity === "green");

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* Print controls - hidden when printing */}
      <div className="no-print sticky top-0 bg-background border-b border-border p-4 z-10">
        <div className="max-w-[21cm] mx-auto flex items-center justify-between">
          <Link
            to={`/machines/${machine.id}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
            Tillbaka till maskin
          </Link>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1.5" strokeWidth={1.75} />
            Skriv ut / Spara som PDF
          </Button>
        </div>
      </div>

      {/* Report Content - A4 optimized */}
      <div className="max-w-[21cm] mx-auto p-8 print:p-0 print:max-w-none">
        {/* Header */}
        <header className="page-break-avoid mb-8 pb-6 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-sm font-semibold tracking-wider text-muted-foreground">
                MACHINDEX
              </p>
              <h1 className="text-2xl font-bold text-foreground mt-1">Maskinrapport</h1>
            </div>
            <div className="text-right">
              <p className="font-mono text-xl font-bold text-foreground tracking-wider">
                {machine.machindexId || machine.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Genererad: {formatDateTime(new Date())}
              </p>
            </div>
          </div>
        </header>

        {/* Section 1: Machine Data */}
        <section className="page-break-avoid mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Maskindata
          </h2>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Tillverkare</dt>
              <dd className="font-medium text-foreground">{machine.brand || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Modell</dt>
              <dd className="font-medium text-foreground">{machine.model || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Serienummer</dt>
              <dd className="font-mono font-medium text-foreground">{machine.serialNumber || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Arsmodell</dt>
              <dd className="font-medium text-foreground">{machine.year > 0 ? machine.year : "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Kategori</dt>
              <dd className="font-medium text-foreground">{getCategoryLabel(machine.category)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Drifttimmar</dt>
              <dd className="font-mono font-medium text-foreground">{formatHours(machine.operatingHours)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium text-foreground">{statusLabels[machine.status]}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">MachIndex ID</dt>
              <dd className="font-mono font-medium text-foreground">
                {machine.machindexId || machine.id.slice(0, 8).toUpperCase()}
              </dd>
            </div>
          </dl>
        </section>

        {/* Section 2: Verification & Trust */}
        <section className="page-break-avoid mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Verifiering & Trust
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                  <p className="text-4xl font-bold font-mono text-foreground">{machine.trustScore}</p>
                  <p className="text-xs text-muted-foreground">Trust Score</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">{machine.miiLevel}</p>
                  <p className="text-xs text-muted-foreground">{MII_LABELS[machine.miiLevel]}</p>
                </div>
              </div>

              {machine.trustBreakdown && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1 font-medium text-muted-foreground">Kategori</th>
                      <th className="text-right py-1 font-medium text-muted-foreground">Poang</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-1">Identitet</td>
                      <td className="py-1 text-right font-mono">
                        {machine.trustBreakdown.identity}/{machine.trustBreakdown.identity_max}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1">Dokument</td>
                      <td className="py-1 text-right font-mono">
                        {machine.trustBreakdown.documents}/{machine.trustBreakdown.documents_max}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1">Verifiering</td>
                      <td className="py-1 text-right font-mono">
                        {machine.trustBreakdown.verification}/{machine.trustBreakdown.verification_max}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1">Historik</td>
                      <td className="py-1 text-right font-mono">
                        {machine.trustBreakdown.history}/{machine.trustBreakdown.history_max}
                      </td>
                    </tr>
                    <tr className="border-t border-border font-semibold">
                      <td className="py-1">Totalt</td>
                      <td className="py-1 text-right font-mono">{machine.trustScore}/100</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-foreground mb-2">Riskflaggor</p>
              <div className="space-y-1">
                {redFlags.map((flag) => (
                  <FlagRow key={flag.code} flag={flag} />
                ))}
                {yellowFlags.map((flag) => (
                  <FlagRow key={flag.code} flag={flag} />
                ))}
                {greenFlags.slice(0, 3).map((flag) => (
                  <FlagRow key={flag.code} flag={flag} />
                ))}
                {greenFlags.length > 3 && (
                  <p className="text-xs text-muted-foreground pl-5">
                    +{greenFlags.length - 3} fler positiva faktorer
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Ownership History */}
        <section className="page-break-avoid mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Agarhistorik
          </h2>
          {currentOwner && (
            <div className="mb-3 p-3 bg-muted/20 rounded-control">
              <p className="text-sm font-medium text-foreground">
                Nuvarande agare: {currentOwner.org_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentOwner.org_number && `Org.nr: ${currentOwner.org_number} · `}
                {currentOwner.owner_since && `Sedan ${formatDate(currentOwner.owner_since)}`}
              </p>
            </div>
          )}
          {ownershipHistory.length > 1 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium text-muted-foreground">Organisation</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Period</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Overforingsmetod</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ownershipHistory.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2">
                      <p className="font-medium text-foreground">{row.organization?.name ?? "Okand"}</p>
                      {row.organization?.org_number && (
                        <p className="text-xs text-muted-foreground">{row.organization.org_number}</p>
                      )}
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {formatDate(row.from_date)} → {row.to_date ? formatDate(row.to_date) : "Nu"}
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {row.transfer_method || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground">Ingen tidigare agare registrerad.</p>
          )}
        </section>

        {/* Section 4: Events (last 20) */}
        <section className="page-break-avoid mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Handelser (senaste 20)
          </h2>
          {events.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium text-muted-foreground">Datum</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Handelse</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Beskrivning</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Utford av</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="py-2 text-muted-foreground font-mono text-xs">
                      {formatDate(event.created_at)}
                    </td>
                    <td className="py-2 font-medium text-foreground">{event.title}</td>
                    <td className="py-2 text-muted-foreground">{event.description || "—"}</td>
                    <td className="py-2 text-muted-foreground">{event.actor_display_name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground">Inga handelser registrerade.</p>
          )}
        </section>

        {/* Section 5: Documents */}
        <section className="page-break-avoid mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Dokument
          </h2>
          {documents.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium text-muted-foreground">Typ</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Titel</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Datum</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Storlek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="py-2 text-muted-foreground">{doc.document_type}</td>
                    <td className="py-2 font-medium text-foreground">{doc.title}</td>
                    <td className="py-2 text-muted-foreground font-mono text-xs">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="py-2 text-muted-foreground font-mono text-xs">
                      {doc.file_size_bytes ? `${Math.round(doc.file_size_bytes / 1024)} KB` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground">Inga dokument uppladdade.</p>
          )}
        </section>

        {/* Section 6: Risk & GPS */}
        <section className="page-break-avoid mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Risk & GPS
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-foreground mb-1">GPS-status</p>
              {machine.gpsConnected ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" strokeWidth={1.75} />
                  <span>
                    Ansluten · Senast uppdaterad:{" "}
                    {machine.lastGpsUpdate ? formatDateTime(machine.lastGpsUpdate) : "Okand"}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ej ansluten</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Riskniva</p>
              <p
                className={cn(
                  "text-lg font-semibold",
                  riskLevel === "low" && "text-primary",
                  riskLevel === "medium" && "text-warning",
                  riskLevel === "high" && "text-destructive"
                )}
              >
                {getRiskLevelLabel(riskLevel)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {riskLevel === "low" && "Maskinen har god verifieringsniva och fa varningsflaggor."}
                {riskLevel === "medium" && "Maskinen har vissa brister som kan atgardas."}
                {riskLevel === "high" && "Maskinen saknar viktig verifiering eller har kritiska flaggor."}
              </p>
            </div>
          </div>
        </section>

        {/* Section 7: QR Code & Footer */}
        <footer className="page-break-avoid pt-8 border-t border-border">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <QRCodeSVG value={reportUrl} size={160} level="M" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-2">
                Skanna for digital version
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                QR-koden leder till maskinens digitala profil i MachIndex dar aktuell data alltid
                finns tillganglig.
              </p>
              <p className="text-xs text-muted-foreground">
                Genererad av MachIndex · {formatDate(new Date())} · machindex.eu
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Denna rapport ar giltig vid genereringsogonblicket. Aktuell data finns alltid online.
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          @page { size: A4; margin: 1.5cm; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          .page-break-before { page-break-before: always; }
          .page-break-avoid { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}

function FlagRow({ flag }: { flag: RiskFlag }) {
  const Icon =
    flag.severity === "red"
      ? AlertTriangle
      : flag.severity === "yellow"
        ? Info
        : CheckCircle;

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm",
        flag.severity === "red" && "text-destructive",
        flag.severity === "yellow" && "text-warning",
        flag.severity === "green" && "text-primary"
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
      <span>{flag.label}</span>
    </div>
  );
}

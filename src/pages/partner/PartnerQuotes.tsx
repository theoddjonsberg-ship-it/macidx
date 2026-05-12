import { Link } from "react-router-dom";
import { FileText, Plus, ChevronRight, Clock } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useQuoteDrafts, RECOMMENDATION_LABELS, RECOMMENDATION_COLORS } from "@/hooks/useQuoteDrafts";
import { cn } from "@/lib/utils";

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "nyss";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} tim`;
  const days = Math.round(hours / 24);
  return `${days} d`;
}

function EmptyState() {
  return (
    <Card className="p-12 text-center">
      <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" strokeWidth={1.5} />
      <p className="text-sm font-medium text-foreground mb-1">Inga offerter</p>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
        Skapa din forsta offert for att borja bedomma kundernas maskinportfolj.
      </p>
      <Button asChild>
        <Link to="/partner/quote/new">
          <Plus className="h-4 w-4 mr-1.5" strokeWidth={1.75} />
          Ny offert
        </Link>
      </Button>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-control" />
            <div className="flex-1">
              <Skeleton className="h-4 w-40 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function PartnerQuotes() {
  const { data: quotes, isLoading } = useQuoteDrafts();

  if (isLoading) {
    return (
      <AppShell>
        <DashboardHeader title="Offerter" subtitle="Laddar offerter..." />
        <LoadingState />
      </AppShell>
    );
  }

  if (!quotes || quotes.length === 0) {
    return (
      <AppShell>
        <DashboardHeader
          title="Offerter"
          subtitle="Inga sparade offerter"
          actions={
            <Button asChild>
              <Link to="/partner/quote/new">
                <Plus className="h-4 w-4 mr-1.5" strokeWidth={1.75} />
                Ny offert
              </Link>
            </Button>
          }
        />
        <EmptyState />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <DashboardHeader
        title="Offerter"
        subtitle={`${quotes.length} sparade offerter`}
        actions={
          <Button asChild>
            <Link to="/partner/quote/new">
              <Plus className="h-4 w-4 mr-1.5" strokeWidth={1.75} />
              Ny offert
            </Link>
          </Button>
        }
      />

      <div className="space-y-3">
        {quotes.map((quote) => (
          <Link key={quote.id} to={`/partner/quotes/${quote.id}`}>
            <Card className="p-4 hover:bg-surface-track transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-control bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {quote.customer_org?.name ?? "Okand kund"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{quote.machine_ids.length} maskiner</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" strokeWidth={1.75} />
                      {timeAgo(quote.created_at)}
                    </span>
                    {quote.creator?.display_name && (
                      <>
                        <span>·</span>
                        <span>{quote.creator.display_name}</span>
                      </>
                    )}
                  </div>
                </div>

                {quote.recommendation && (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                      RECOMMENDATION_COLORS[quote.recommendation]
                    )}
                  >
                    {RECOMMENDATION_LABELS[quote.recommendation]}
                  </span>
                )}

                {quote.exported_at && (
                  <span className="text-[10px] text-muted-foreground">Exporterad</span>
                )}

                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" strokeWidth={1.75} />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}

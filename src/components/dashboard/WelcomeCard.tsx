import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useProfile } from "@/hooks/useProfile";
import { useActiveOrg } from "@/hooks/useActiveOrg";

export function WelcomeCard() {
  const { data: profile, isLoading: pLoading } = useProfile();
  const { data: org, isLoading: oLoading } = useActiveOrg();

  if (pLoading || oLoading) {
    return (
      <Card>
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-7 w-56 mb-2" />
        <Skeleton className="h-4 w-40 mb-4" />
        <Skeleton className="h-4 w-full" />
      </Card>
    );
  }

  const name = profile?.display_name?.split(" ")[0] ?? "användare";

  return (
    <Card className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
            Översikt
          </p>
          <h2 className="text-xl font-semibold mt-1 text-foreground truncate">
            Välkommen tillbaka, {name}
          </h2>
          <p className="text-sm text-muted-foreground mt-1 truncate">
            {org?.name ?? "Ingen aktiv organisation"}
          </p>
        </div>
        {org && (
          <span className="inline-flex items-center rounded-chip bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium font-mono uppercase tracking-wide shrink-0">
            Aktiv
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mt-4">
        Du har en aktiv Machindex-grund. I v0.1 kan du hantera team, sätta rollbaserad behörighet och följa organisationsaktivitet. Maskinregistret öppnas i v0.2.
      </p>
    </Card>
  );
}

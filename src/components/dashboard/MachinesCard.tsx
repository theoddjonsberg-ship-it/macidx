import { Link } from "react-router-dom";
import { Wrench, Plus, ChevronRight } from "lucide-react";
import { useMachines } from "@/hooks/useMachines";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { getCategoryIcon, miiLevelTone } from "@/lib/machine-utils";
import { cn } from "@/lib/utils";

export function MachinesCard() {
  const { data: machines, isLoading } = useMachines();
  const recentMachines = (machines ?? []).slice(0, 3);

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-coin bg-primary/15 flex items-center justify-center">
            <Wrench className="h-4 w-4 text-primary" strokeWidth={1.75} />
          </div>
          <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
            Mina maskiner
          </p>
        </div>
        <Link to="/machines/add">
          <Button variant="secondary" size="sm" className="h-8 px-2">
            <Plus className="h-4 w-4" strokeWidth={1.75} />
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2 flex-1">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : recentMachines.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
          <p className="text-sm text-muted-foreground mb-2">Inga maskiner ännu</p>
          <Link to="/machines/add">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" strokeWidth={1.75} />
              Lägg till maskin
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border flex-1">
            {recentMachines.map((m) => {
              const Icon = getCategoryIcon(m.category);
              return (
                <li key={m.id}>
                  <Link
                    to={`/machines/${m.id}`}
                    className="flex items-center gap-3 py-2 hover:bg-surface-track -mx-4 px-4 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-control border border-border bg-surface-track flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[m.brand, m.model].filter(Boolean).join(" ") || "—"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded border",
                        miiLevelTone(m.miiLevel)
                      )}
                    >
                      {m.miiLevel}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <Link
            to="/machines"
            className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Visa alla maskiner
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
          </Link>
        </>
      )}
    </Card>
  );
}

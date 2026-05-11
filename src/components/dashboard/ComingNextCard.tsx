import { Wrench } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function ComingNextCard() {
  return (
    <Card variant="feature">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-coin bg-accent flex items-center justify-center shrink-0">
          <Wrench className="h-5 w-5 text-accent-foreground" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
            Kommer härnäst
          </p>
          <h3 className="text-base font-semibold mt-1 text-foreground">Maskinregister</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Planerad i v0.2: maskinregister med dokumentation och servicehistorik.
          </p>
        </div>
      </div>
    </Card>
  );
}

import { Card } from "@/components/ui/Card";

export function ComingNextCard() {
  return (
    <Card>
      <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
        Kommer härnäst
      </p>
      <h3 className="text-base font-semibold mt-1">Maskinregister</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Maskinregistret kommer i v0.2.
      </p>
    </Card>
  );
}

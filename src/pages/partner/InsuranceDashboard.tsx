import { Shield } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";

export function InsuranceDashboard() {
  return (
    <AppShell>
      <DashboardHeader
        title="Forsakringsoversikt"
        subtitle="Portfolj, riskbedomningar och forfallande policyer."
      />
      <Card className="p-8 text-center">
        <Shield className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" strokeWidth={1.5} />
        <p className="text-sm font-semibold text-foreground mb-1">Insurance Dashboard</p>
        <p className="text-sm text-muted-foreground">Under bygge — fylls i nasta prompt.</p>
      </Card>
    </AppShell>
  );
}

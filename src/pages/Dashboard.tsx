import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { TeamCard } from "@/components/dashboard/TeamCard";
import { AuditCard } from "@/components/dashboard/AuditCard";
import { NextStepsCard } from "@/components/dashboard/NextStepsCard";
import { ComingNextCard } from "@/components/dashboard/ComingNextCard";

export function Dashboard() {
  return (
    <AppShell>
      <DashboardHeader
        title="Översikt"
        subtitle="Hantera team, behörigheter och organisationsstatus. Maskinregistret öppnas i v0.2."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <WelcomeCard />
        </div>
        <div>
          <TeamCard />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <AuditCard />
        </div>
        <div>
          <NextStepsCard />
        </div>
      </div>

      <ComingNextCard />
    </AppShell>
  );
}

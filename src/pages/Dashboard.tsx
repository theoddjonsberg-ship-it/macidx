import { AppShell } from "@/components/layout/AppShell";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { TeamCard } from "@/components/dashboard/TeamCard";
import { AuditCard } from "@/components/dashboard/AuditCard";
import { ComingNextCard } from "@/components/dashboard/ComingNextCard";

export function Dashboard() {
  return (
    <AppShell>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <WelcomeCard />
        <TeamCard />
        <div className="sm:col-span-2">
          <AuditCard />
        </div>
        <div className="sm:col-span-2">
          <ComingNextCard />
        </div>
      </div>
    </AppShell>
  );
}

import { useActiveOrg } from "@/hooks/useActiveOrg";
import { Dashboard } from "@/pages/Dashboard";
import { InsuranceDashboard } from "@/pages/partner/InsuranceDashboard";
import { FinanceDashboard } from "@/pages/partner/FinanceDashboard";
import { TechnicianDashboard } from "@/pages/TechnicianDashboard";
import { Skeleton } from "@/components/ui/Skeleton";
import { AppShell } from "@/components/layout/AppShell";

export function RoleRouter() {
  const { data: activeOrg, isLoading } = useActiveOrg();

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AppShell>
    );
  }

  const orgType = activeOrg?.org_type ?? "machine_owner";

  switch (orgType) {
    case "insurance":
      return <InsuranceDashboard />;
    case "finance":
    case "leasing":
      return <FinanceDashboard />;
    case "service_partner":
      return <TechnicianDashboard />;
    case "machine_owner":
    case "dealer":
    case "oem":
    default:
      return <Dashboard />;
  }
}

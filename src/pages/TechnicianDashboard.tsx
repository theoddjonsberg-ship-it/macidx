import { Link } from "react-router-dom";
import { Wrench, AlertCircle, Clock, MapPin, Building2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { MIIBadge } from "@/components/machine/MIIBadge";
import { usePartnerPortfolio, type PortfolioMachine } from "@/hooks/usePartnerPortfolio";

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent?: "default" | "warning" | "success";
}) {
  const accentColor =
    accent === "warning"
      ? "text-yellow-600"
      : accent === "success"
        ? "text-green-600"
        : "text-muted-foreground";

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-muted ${accentColor}`}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function MachineRow({ machine }: { machine: PortfolioMachine }) {
  const serviceOverdue =
    machine.operating_hours > 0 &&
    machine.operating_hours >= (machine.operating_hours - (machine.operating_hours % 500) + 500);

  return (
    <Link
      to={`/machines/${machine.id}`}
      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{machine.name}</p>
        <p className="text-sm text-muted-foreground truncate">
          {machine.brand} {machine.model} {machine.year ? `(${machine.year})` : ""}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {serviceOverdue && (
          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium text-yellow-600 border-yellow-300 bg-yellow-50">
            <Clock className="h-3 w-3 mr-1" strokeWidth={1.75} />
            Service
          </span>
        )}

        {machine.latitude && machine.longitude ? (
          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium text-green-600 border-green-300 bg-green-50">
            <MapPin className="h-3 w-3 mr-1" strokeWidth={1.75} />
            GPS
          </span>
        ) : null}

        <MIIBadge level={machine.mii_level} variant="compact" />
      </div>
    </Link>
  );
}

function CustomerSection({
  customerId,
  customerName,
  machines,
}: {
  customerId: string;
  customerName: string;
  machines: PortfolioMachine[];
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
        <Building2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
        <Link
          to={`/partner/customers/${customerId}`}
          className="font-medium hover:underline"
        >
          {customerName}
        </Link>
        <span className="text-sm text-muted-foreground ml-auto">
          {machines.length} {machines.length === 1 ? "maskin" : "maskiner"}
        </span>
      </div>
      <div className="divide-y">
        {machines.map((m) => (
          <MachineRow key={m.id} machine={m} />
        ))}
      </div>
    </Card>
  );
}

export function TechnicianDashboard() {
  const { data: portfolio, isLoading } = usePartnerPortfolio();
  const machines = portfolio ?? [];

  // Calculate KPIs
  const totalMachines = machines.length;
  const serviceOverdueCount = machines.filter((m) => {
    const nextServiceAt = m.operating_hours - (m.operating_hours % 500) + 500;
    return m.operating_hours >= nextServiceAt;
  }).length;
  const gpsConnectedCount = machines.filter((m) => m.latitude && m.longitude).length;

  // Group machines by customer
  const machinesByCustomer = new Map<string, { name: string; machines: PortfolioMachine[] }>();
  for (const m of machines) {
    const orgId = m.org_id;
    const orgName = m.organization?.name ?? "Okänd kund";
    if (!machinesByCustomer.has(orgId)) {
      machinesByCustomer.set(orgId, { name: orgName, machines: [] });
    }
    machinesByCustomer.get(orgId)!.machines.push(m);
  }

  // Empty state
  if (!isLoading && machines.length === 0) {
    return (
      <AppShell>
        <DashboardHeader
          title="Mina uppdrag"
          subtitle="Tilldelade maskiner och servicehistorik."
        />
        <Card className="p-8 text-center">
          <Wrench className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-foreground mb-1">Inga maskiner tilldelade</p>
          <p className="text-sm text-muted-foreground">
            Kontakta din kontaktperson för att få tillgång till maskiner.
          </p>
        </Card>
      </AppShell>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <AppShell>
        <DashboardHeader
          title="Mina uppdrag"
          subtitle="Tilldelade maskiner och servicehistorik."
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-muted" />
                <div className="space-y-2">
                  <div className="h-6 w-12 bg-muted rounded" />
                  <div className="h-4 w-24 bg-muted rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-6 w-48 bg-muted rounded mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-12 bg-muted rounded" />
                ))}
              </div>
            </Card>
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <DashboardHeader
        title="Mina uppdrag"
        subtitle="Tilldelade maskiner och servicehistorik."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard
          label="Tilldelade maskiner"
          value={totalMachines}
          icon={Wrench}
        />
        <KpiCard
          label="Service förfallen"
          value={serviceOverdueCount}
          icon={AlertCircle}
          accent={serviceOverdueCount > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="GPS-anslutna"
          value={gpsConnectedCount}
          icon={MapPin}
          accent={gpsConnectedCount > 0 ? "success" : "default"}
        />
      </div>

      {/* Machines grouped by customer */}
      <div className="space-y-4">
        {Array.from(machinesByCustomer.entries()).map(([orgId, { name, machines }]) => (
          <CustomerSection
            key={orgId}
            customerId={orgId}
            customerName={name}
            machines={machines}
          />
        ))}
      </div>
    </AppShell>
  );
}

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Edit,
  LayoutDashboard,
  FileText,
  History,
  Users,
  ShieldCheck,
  MapPin,
  Clock,
} from "lucide-react";
import { useMachine, useUpdateMachine } from "@/hooks/useMachines";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { useMyOrgRole } from "@/hooks/useMyOrgRole";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";
import { TrustGauge } from "@/components/machine/TrustGauge";
import { MIIBadge } from "@/components/machine/MIIBadge";
import { MachineDocuments } from "@/components/machine/MachineDocuments";
import { MachineEvents } from "@/components/machine/MachineEvents";
import { MachineOwnership } from "@/components/machine/MachineOwnership";
import { MachineConsent } from "@/components/machine/MachineConsent";
import {
  getCategoryIcon,
  getCategoryLabel,
  statusLabels,
  statusChipStyles,
  categoryOptions,
} from "@/lib/machine-utils";
import { RiskOverviewCard } from "@/components/machine/RiskOverviewCard";
import { cn } from "@/lib/utils";

// Tab configuration
const tabConfig = [
  { key: "overview", label: "Översikt", icon: LayoutDashboard },
  { key: "documents", label: "Dokument", icon: FileText },
  { key: "events", label: "Händelser", icon: History },
  { key: "ownership", label: "Ägarskap", icon: Users },
  { key: "consent", label: "Samtycke", icon: ShieldCheck },
] as const;

type TabKey = (typeof tabConfig)[number]["key"];

// Edit form schema
const editMachineSchema = z.object({
  name: z.string().trim().min(1, "Namn krävs").max(200),
  brand: z.string().trim().max(100).optional(),
  model: z.string().trim().max(100).optional(),
  serial_number: z.string().trim().max(100).optional(),
  year: z.string().optional(),
  type: z.string().optional(),
  operating_hours: z.string().optional(),
});

type EditMachineFormData = z.infer<typeof editMachineSchema>;

export function MachineProfile() {
  const { id } = useParams<{ id: string }>();
  const { data: machine, isLoading } = useMachine(id);
  const updateMachine = useUpdateMachine();
  const { data: activeOrg } = useActiveOrg();
  const { data: myRole } = useMyOrgRole(activeOrg?.id);

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Role-based access - only allow editing for owner/admin AND only if machine belongs to user's org
  const isOwnMachine = machine?.orgId === activeOrg?.id;
  const canManage = isOwnMachine && (myRole === "owner" || myRole === "admin");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditMachineFormData>({
    resolver: zodResolver(editMachineSchema),
    defaultValues: {
      name: machine?.name ?? "",
      brand: machine?.brand ?? "",
      model: machine?.model ?? "",
      serial_number: machine?.serialNumber ?? "",
      year: machine?.year ? String(machine.year) : "",
      type: machine?.category ?? "",
      operating_hours: machine?.operatingHours ? String(machine.operatingHours) : "",
    },
  });

  // Reset form when machine data changes or editing starts
  const startEditing = () => {
    if (machine) {
      reset({
        name: machine.name,
        brand: machine.brand,
        model: machine.model,
        serial_number: machine.serialNumber,
        year: machine.year ? String(machine.year) : "",
        type: machine.category,
        operating_hours: String(machine.operatingHours),
      });
    }
    setIsEditing(true);
    setSubmitError(null);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setSubmitError(null);
  };

  const onSubmit = async (values: EditMachineFormData) => {
    if (!machine) return;
    setSubmitError(null);

    try {
      await updateMachine.mutateAsync({
        id: machine.id,
        name: values.name,
        brand: values.brand || undefined,
        model: values.model || undefined,
        serial_number: values.serial_number || undefined,
        year: values.year ? parseInt(values.year, 10) : null,
        type: values.type || undefined,
        operating_hours: values.operating_hours ? parseInt(values.operating_hours, 10) : undefined,
      });
      setIsEditing(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Kunde inte spara ändringar");
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Card className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <Skeleton className="h-36 w-48 rounded-control" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-24 w-24 rounded-full" />
            </div>
          </Card>
          <Skeleton className="h-10 w-full" />
          <Card>
            <Skeleton className="h-48 w-full" />
          </Card>
        </div>
      </AppShell>
    );
  }

  if (!machine) {
    return (
      <AppShell>
        <Card className="p-6">
          <p className="text-sm font-semibold text-foreground mb-2">Maskin hittades inte</p>
          <p className="text-sm text-muted-foreground mb-4">
            Maskinen finns inte eller så saknar du behörighet att se den.
          </p>
          <Link to="/machines">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1.5" strokeWidth={1.75} />
              Tillbaka till maskiner
            </Button>
          </Link>
        </Card>
      </AppShell>
    );
  }

  const Icon = getCategoryIcon(machine.category);
  const categoryLabel = getCategoryLabel(machine.category);
  const subtitle = [machine.brand, machine.model].filter(Boolean).join(" ").trim() || categoryLabel;

  return (
    <AppShell>
      {/* Back link */}
      <div className="mb-4">
        <Link
          to="/machines"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          Tillbaka
        </Link>
      </div>

      {/* Hero Section */}
      <Card className="p-4 sm:p-6 mb-4">
        <div className="flex flex-col lg:flex-row items-start gap-4 sm:gap-6">
          {/* Machine image/placeholder */}
          <div className="flex h-32 w-44 sm:h-36 sm:w-52 flex-shrink-0 items-center justify-center rounded-control border border-border bg-surface-track">
            {machine.imageUrl ? (
              <img
                src={machine.imageUrl}
                alt={machine.name}
                className="h-full w-full object-cover rounded-control"
              />
            ) : (
              <Icon className="h-12 w-12 text-muted-foreground/40" strokeWidth={1.5} />
            )}
          </div>

          {/* Machine info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground truncate mb-1">
              {machine.name}
            </h1>
            <p className="text-sm text-muted-foreground mb-3">{subtitle}</p>

            {/* Status badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                  statusChipStyles[machine.status]
                )}
              >
                {statusLabels[machine.status]}
              </span>
              <MIIBadge level={machine.miiLevel} variant="full" />
              {machine.gpsConnected && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  <MapPin className="h-3 w-3" strokeWidth={1.75} />
                  GPS
                </span>
              )}
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
                {machine.operatingHours.toLocaleString("sv-SE")} h
              </span>
              {machine.year > 0 && <span>{machine.year}</span>}
              <span>{categoryLabel}</span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-4">
              {canManage && (
                <Button variant="secondary" size="sm" onClick={startEditing}>
                  <Edit className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.75} />
                  Redigera
                </Button>
              )}
              <Link to={`/machines/${machine.id}/report`}>
                <Button variant="secondary" size="sm">
                  <FileText className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.75} />
                  Generera rapport
                </Button>
              </Link>
            </div>
          </div>

          {/* Trust Gauge */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <TrustGauge score={machine.trustScore} size="md" />
            <span className="text-xs text-muted-foreground">Trust Score</span>
          </div>
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="border-b border-border mb-4 overflow-x-auto scrollbar-thin">
        <div className="flex gap-1">
          {tabConfig.map((tab) => {
            const isActive = activeTab === tab.key;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap min-h-[44px]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground/70"
                )}
              >
                <TabIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.75} />
                <span className="hidden sm:inline">{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <OverviewTab
          machine={machine}
          isEditing={isEditing}
          register={register}
          errors={errors}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onSubmit={handleSubmit(onSubmit)}
          onCancel={cancelEditing}
          showOwnerTips={activeOrg?.org_type === "machine_owner"}
        />
      )}

      {activeTab === "documents" && (
        <MachineDocuments machineId={machine.id} canManage={canManage} />
      )}

      {activeTab === "events" && <MachineEvents machineId={machine.id} />}

      {activeTab === "ownership" && activeOrg && (
        <MachineOwnership
          machine={machine}
          orgId={activeOrg.id}
          canManage={canManage}
        />
      )}

      {activeTab === "consent" && activeOrg && (
        <MachineConsent
          machineId={machine.id}
          orgId={activeOrg.id}
          canManage={canManage}
        />
      )}
    </AppShell>
  );
}

// Overview Tab Component
interface OverviewTabProps {
  machine: NonNullable<ReturnType<typeof useMachine>["data"]>;
  isEditing: boolean;
  register: ReturnType<typeof useForm<EditMachineFormData>>["register"];
  errors: ReturnType<typeof useForm<EditMachineFormData>>["formState"]["errors"];
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
  onCancel: () => void;
  showOwnerTips?: boolean;
}

function OverviewTab({
  machine,
  isEditing,
  register,
  errors,
  isSubmitting,
  submitError,
  onSubmit,
  onCancel,
  showOwnerTips = false,
}: OverviewTabProps) {
  if (isEditing) {
    return (
      <Card className="max-w-xl">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">Namn *</Label>
            <Input
              id="name"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            <FormError>{errors.name?.message}</FormError>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Märke</Label>
              <Input
                id="brand"
                {...register("brand")}
                aria-invalid={!!errors.brand}
              />
              <FormError>{errors.brand?.message}</FormError>
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Modell</Label>
              <Input
                id="model"
                {...register("model")}
                aria-invalid={!!errors.model}
              />
              <FormError>{errors.model?.message}</FormError>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serial_number">Serienummer</Label>
            <Input
              id="serial_number"
              {...register("serial_number")}
              aria-invalid={!!errors.serial_number}
            />
            <FormError>{errors.serial_number?.message}</FormError>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Årsmodell</Label>
              <Input
                id="year"
                type="number"
                {...register("year")}
                aria-invalid={!!errors.year}
              />
              <FormError>{errors.year?.message}</FormError>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Kategori</Label>
              <select
                id="type"
                {...register("type")}
                className="flex h-10 w-full rounded-control border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Välj kategori</option>
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <FormError>{errors.type?.message}</FormError>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="operating_hours">Drifttimmar</Label>
            <Input
              id="operating_hours"
              type="number"
              {...register("operating_hours")}
              aria-invalid={!!errors.operating_hours}
            />
            <FormError>{errors.operating_hours?.message}</FormError>
          </div>

          <FormError>{submitError}</FormError>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sparar..." : "Spara ändringar"}
            </Button>
            <Button type="button" variant="secondary" onClick={onCancel}>
              Avbryt
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  // Read-only spec grid
  const specs = [
    { label: "MachIndex ID", value: machine.machindexId || "—", mono: true },
    { label: "Serienummer", value: machine.serialNumber || "—", mono: true },
    { label: "Märke", value: machine.brand || "—" },
    { label: "Modell", value: machine.model || "—" },
    { label: "Årsmodell", value: machine.year > 0 ? String(machine.year) : "—" },
    { label: "Kategori", value: getCategoryLabel(machine.category) },
    { label: "Drifttimmar", value: `${machine.operatingHours.toLocaleString("sv-SE")} h`, mono: true },
    { label: "Status", value: statusLabels[machine.status] },
    { label: "MII-nivå", value: machine.miiLevel },
    { label: "Verifieringsnivå", value: String(machine.verificationLevel) },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Main specs */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <h3 className="text-sm font-semibold text-foreground mb-4">Specifikationer</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {specs.map((spec) => (
              <div key={spec.label}>
                <dt className="text-xs text-muted-foreground mb-0.5">{spec.label}</dt>
                <dd className={cn("text-sm text-foreground", spec.mono && "font-mono")}>
                  {spec.value}
                </dd>
              </div>
            ))}
          </div>
        </Card>

        {/* Risk Overview Card */}
        <RiskOverviewCard machineId={machine.id} showOwnerTips={showOwnerTips} />
      </div>

      {/* Trust Score Breakdown */}
      <div>
        <Card>
          <h3 className="text-sm font-semibold text-foreground mb-4">Trust Score</h3>
          <div className="flex flex-col items-center gap-4">
            <TrustGauge score={machine.trustScore} size="lg" />
            <div className="w-full space-y-2">
              <TrustCategory
                label="Identitet"
                value={machine.trustBreakdown?.identity ?? 0}
                max={machine.trustBreakdown?.identity_max ?? 25}
              />
              <TrustCategory
                label="Dokument"
                value={machine.trustBreakdown?.documents ?? 0}
                max={machine.trustBreakdown?.documents_max ?? 25}
              />
              <TrustCategory
                label="Verifiering"
                value={machine.trustBreakdown?.verification ?? 0}
                max={machine.trustBreakdown?.verification_max ?? 25}
              />
              <TrustCategory
                label="Historik"
                value={machine.trustBreakdown?.history ?? 0}
                max={machine.trustBreakdown?.history_max ?? 25}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Trust Category Progress Bar
function TrustCategory({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const color =
    pct >= 80
      ? "bg-primary"
      : pct >= 50
        ? "bg-warning"
        : "bg-muted-foreground";

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums text-foreground">
          {value}/{max}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}


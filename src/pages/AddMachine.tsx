import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Camera, Sparkles, CheckCircle2, Loader2, Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";
import { useCreateMachine } from "@/hooks/useMachines";
import { useScanNameplate } from "@/hooks/useScanNameplate";
import {
  useResearchMachine,
  mapCategoryToFormValue,
  mapFuelTypeToFormValue,
  type MachineResearchResult,
} from "@/hooks/useResearchMachine";
import { addMachineSchema, type AddMachineInput } from "@/lib/validation/machine";
import { categoryOptions, fuelTypeOptions } from "@/lib/machine-utils";

interface ExtendedConfidence {
  manufacturer: number;
  model: number;
  serial_number: number;
  year: number;
  operating_hours: number;
  category?: number;
  fuel_type?: number;
  weight_kg?: number;
}

export function AddMachine() {
  const navigate = useNavigate();
  const createMachine = useCreateMachine();
  const scanMutation = useScanNameplate();
  const researchMutation = useResearchMachine();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<ExtendedConfidence | null>(null);
  const [scanPhase, setScanPhase] = useState<"idle" | "scanning" | "researching">("idle");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(addMachineSchema),
    defaultValues: {
      name: "",
      brand: "",
      model: "",
      serial_number: "",
      year: "",
      type: "",
      fuel_type: "",
      operating_hours: "",
      weight_kg: "",
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Bilden får vara max 4 MB");
      return;
    }

    try {
      // Phase 1: OCR scan
      setScanPhase("scanning");
      const scanResult = await scanMutation.mutateAsync(file);

      // Fill in OCR fields
      if (scanResult.manufacturer) setValue("brand", scanResult.manufacturer);
      if (scanResult.model) setValue("model", scanResult.model);
      if (scanResult.serial_number) setValue("serial_number", scanResult.serial_number);
      if (scanResult.year) setValue("year", String(scanResult.year));
      if (scanResult.operating_hours) setValue("operating_hours", String(scanResult.operating_hours));
      if (scanResult.manufacturer && scanResult.model) {
        setValue("name", `${scanResult.manufacturer} ${scanResult.model}`);
      }

      // Initialize confidence with OCR results
      const newConfidence: ExtendedConfidence = { ...scanResult.confidence };
      setConfidence(newConfidence);

      toast.success("Typskylt avläst — söker specifikationer...");

      // Phase 2: Deep research (only if we have manufacturer and model)
      if (scanResult.manufacturer && scanResult.model) {
        setScanPhase("researching");
        try {
          const researchResult = await researchMutation.mutateAsync({
            manufacturer: scanResult.manufacturer,
            model: scanResult.model,
            year: scanResult.year,
          });

          // Fill in researched fields
          applyResearchResults(researchResult, newConfidence);

          toast.success("Specifikationer hittade — verifiera värdena");
        } catch {
          // Research failed, but OCR succeeded - still useful
          toast.info("Kunde inte hitta specifikationer — fyll i manuellt");
        }
      } else {
        toast.success("Typskylt analyserad — verifiera värdena nedan");
      }
    } catch {
      toast.error("Kunde inte analysera bilden");
    } finally {
      setScanPhase("idle");
    }
  };

  const applyResearchResults = (research: MachineResearchResult, currentConfidence: ExtendedConfidence) => {
    const updatedConfidence = { ...currentConfidence };

    // Category
    if (research.category) {
      const categoryValue = mapCategoryToFormValue(research.category);
      if (categoryValue) {
        setValue("type", categoryValue);
        updatedConfidence.category = research.confidence;
      }
    }

    // Fuel type
    if (research.fuel_type) {
      const fuelValue = mapFuelTypeToFormValue(research.fuel_type);
      if (fuelValue) {
        setValue("fuel_type", fuelValue);
        updatedConfidence.fuel_type = research.confidence;
      }
    }

    // Weight
    if (research.weight_kg) {
      setValue("weight_kg", String(research.weight_kg));
      updatedConfidence.weight_kg = research.confidence;
    }

    setConfidence(updatedConfidence);
  };

  const onSubmit = async (values: Record<string, unknown>) => {
    const parsed = values as AddMachineInput;
    setSubmitError(null);
    try {
      const result = await createMachine.mutateAsync({
        name: parsed.name,
        brand: parsed.brand || undefined,
        model: parsed.model || undefined,
        serial_number: parsed.serial_number || undefined,
        year: parsed.year,
        type: parsed.type || undefined,
        operating_hours: parsed.operating_hours,
        verification_metadata: confidence
          ? {
              source: "ai_ocr",
              ai_confidence: confidence as unknown as Record<string, number>,
              ai_extracted_at: new Date().toISOString(),
            }
          : undefined,
      });
      navigate(`/machines/${result.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Kunde inte spara maskinen");
    }
  };

  const isProcessing = scanPhase !== "idle";

  return (
    <AppShell>
      <DashboardHeader
        title="Lägg till maskin"
        subtitle="Registrera en ny maskin i ditt register."
      />

      <div className="space-y-4 max-w-xl">
        {/* AI OCR Card */}
        <Card className="border-primary/20 bg-primary/5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-control bg-primary/10 shrink-0">
              <Sparkles className="h-5 w-5 text-primary" strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Snabbregistrera via typskyltsfoto
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Ta ett foto av maskinens typskylt så fyller AI:n i fälten och söker upp specifikationer.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                {scanPhase === "scanning" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" strokeWidth={1.75} />
                    Läser typskylt...
                  </>
                ) : scanPhase === "researching" ? (
                  <>
                    <Search className="h-4 w-4 mr-1.5 animate-pulse" strokeWidth={1.75} />
                    Söker specifikationer...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-1.5" strokeWidth={1.75} />
                    Välj eller fota typskylt
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Form Card */}
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-1.5">
                Namn *
                {confidence?.manufacturer && confidence?.model && (
                  <AIBadge confidence={Math.min(confidence.manufacturer, confidence.model)} />
                )}
              </Label>
              <Input
                id="name"
                placeholder="T.ex. Volvo EC220E"
                autoFocus
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              <FormError>{errors.name?.message}</FormError>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand" className="flex items-center gap-1.5">
                  Märke
                  {confidence?.manufacturer !== undefined && confidence.manufacturer > 0 && (
                    <AIBadge confidence={confidence.manufacturer} />
                  )}
                </Label>
                <Input
                  id="brand"
                  placeholder="T.ex. Volvo"
                  {...register("brand")}
                  aria-invalid={!!errors.brand}
                />
                <FormError>{errors.brand?.message}</FormError>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model" className="flex items-center gap-1.5">
                  Modell
                  {confidence?.model !== undefined && confidence.model > 0 && (
                    <AIBadge confidence={confidence.model} />
                  )}
                </Label>
                <Input
                  id="model"
                  placeholder="T.ex. EC220E"
                  {...register("model")}
                  aria-invalid={!!errors.model}
                />
                <FormError>{errors.model?.message}</FormError>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serial_number" className="flex items-center gap-1.5">
                Serienummer
                {confidence?.serial_number !== undefined && confidence.serial_number > 0 && (
                  <AIBadge confidence={confidence.serial_number} />
                )}
              </Label>
              <Input
                id="serial_number"
                placeholder="T.ex. VCE123456789"
                {...register("serial_number")}
                aria-invalid={!!errors.serial_number}
              />
              <FormError>{errors.serial_number?.message}</FormError>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year" className="flex items-center gap-1.5">
                  Årsmodell
                  {confidence?.year !== undefined && confidence.year > 0 && (
                    <AIBadge confidence={confidence.year} />
                  )}
                </Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="T.ex. 2022"
                  {...register("year")}
                  aria-invalid={!!errors.year}
                />
                <FormError>{errors.year?.message}</FormError>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="flex items-center gap-1.5">
                  Kategori
                  {confidence?.category !== undefined && confidence.category > 0 && (
                    <AIBadge confidence={confidence.category} source="research" />
                  )}
                </Label>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fuel_type" className="flex items-center gap-1.5">
                  Bränsle
                  {confidence?.fuel_type !== undefined && confidence.fuel_type > 0 && (
                    <AIBadge confidence={confidence.fuel_type} source="research" />
                  )}
                </Label>
                <select
                  id="fuel_type"
                  {...register("fuel_type")}
                  className="flex h-10 w-full rounded-control border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Välj bränsle</option>
                  {fuelTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <FormError>{errors.fuel_type?.message}</FormError>
              </div>

              <div className="space-y-2">
                <Label htmlFor="operating_hours" className="flex items-center gap-1.5">
                  Drifttimmar
                  {confidence?.operating_hours !== undefined && confidence.operating_hours > 0 && (
                    <AIBadge confidence={confidence.operating_hours} />
                  )}
                </Label>
                <Input
                  id="operating_hours"
                  type="number"
                  placeholder="T.ex. 1200"
                  {...register("operating_hours")}
                  aria-invalid={!!errors.operating_hours}
                />
                <FormError>{errors.operating_hours?.message}</FormError>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight_kg" className="flex items-center gap-1.5">
                Vikt (kg)
                {confidence?.weight_kg !== undefined && confidence.weight_kg > 0 && (
                  <AIBadge confidence={confidence.weight_kg} source="research" />
                )}
              </Label>
              <Input
                id="weight_kg"
                type="number"
                placeholder="T.ex. 22000"
                {...register("weight_kg")}
                aria-invalid={!!errors.weight_kg}
              />
              <FormError>{errors.weight_kg?.message}</FormError>
            </div>

            <FormError>{submitError}</FormError>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting || isProcessing}>
                {isSubmitting ? "Sparar..." : "Spara maskin"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate("/machines")}>
                Avbryt
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}

function AIBadge({ confidence, source = "ocr" }: { confidence: number; source?: "ocr" | "research" }) {
  const color = source === "research" ? "text-blue-600" : "text-green-600";
  const label = source === "research" ? "AI-uppslagning" : "AI-extraherat";

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs ${color}`}
      title={`${label} (${Math.round(confidence * 100)}% säkerhet)`}
    >
      <CheckCircle2 className="h-3 w-3" strokeWidth={1.75} />
    </span>
  );
}

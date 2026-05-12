import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";
import { useCreateMachine } from "@/hooks/useMachines";
import { addMachineSchema, type AddMachineInput } from "@/lib/validation/machine";
import { categoryOptions, fuelTypeOptions } from "@/lib/machine-utils";

export function AddMachine() {
  const navigate = useNavigate();
  const createMachine = useCreateMachine();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
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
      });
      navigate(`/machines/${result.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Kunde inte spara maskinen");
    }
  };

  return (
    <AppShell>
      <DashboardHeader
        title="Lägg till maskin"
        subtitle="Registrera en ny maskin i ditt register."
      />

      <Card className="max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">Namn *</Label>
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
              <Label htmlFor="brand">Märke</Label>
              <Input
                id="brand"
                placeholder="T.ex. Volvo"
                {...register("brand")}
                aria-invalid={!!errors.brand}
              />
              <FormError>{errors.brand?.message}</FormError>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Modell</Label>
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
            <Label htmlFor="serial_number">Serienummer</Label>
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
              <Label htmlFor="year">Årsmodell</Label>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fuel_type">Bränsle</Label>
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
              <Label htmlFor="operating_hours">Drifttimmar</Label>
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
            <Label htmlFor="weight_kg">Vikt (kg)</Label>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sparar..." : "Spara maskin"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate("/machines")}>
              Avbryt
            </Button>
          </div>
        </form>
      </Card>
    </AppShell>
  );
}

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import {
  createOrgSchema,
  joinOrgSchema,
  type CreateOrgInput,
  type JoinOrgInput,
} from "@/lib/validation/onboarding";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";
import { OnboardingLayout } from "./OnboardingLayout";

type Mode = "create" | "join";

interface Props {
  onNext: () => void;
}

export function StepOrganization({ onNext }: Props) {
  const [mode, setMode] = useState<Mode>("create");

  return (
    <OnboardingLayout
      step={3}
      total={5}
      title="Din organisation"
      subtitle="Skapa en ny, eller gå med via inbjudningskod."
    >
      <div
        role="tablist"
        aria-label="Välj alternativ"
        className="flex gap-1 mb-4 p-1 bg-surface-track rounded-input"
      >
        <ModeButton active={mode === "create"} onClick={() => setMode("create")}>
          Skapa ny
        </ModeButton>
        <ModeButton active={mode === "join"} onClick={() => setMode("join")}>
          Gå med
        </ModeButton>
      </div>

      {mode === "create" ? (
        <CreateForm onSuccess={onNext} />
      ) : (
        <JoinForm onSuccess={onNext} />
      )}
    </OnboardingLayout>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex-1 h-9 min-h-touch text-sm rounded-input transition-colors ease-standard duration-base",
        active ? "bg-surface-raised text-foreground" : "text-muted-foreground"
      )}
    >
      {children}
    </button>
  );
}

function CreateForm({ onSuccess }: { onSuccess: () => void }) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrgInput>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: { name: "", org_number: "", country: "SE" },
  });

  const onSubmit = async (values: CreateOrgInput) => {
    setSubmitError(null);
    const { error } = await supabase.from("organizations").insert({
      name: values.name,
      org_number: values.org_number || null,
      country: values.country || null,
    });
    if (error) {
      setSubmitError(error.message);
      return;
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="name">Organisationsnamn</Label>
        <Input id="name" autoFocus {...register("name")} aria-invalid={!!errors.name} />
        <FormError>{errors.name?.message}</FormError>
      </div>

      <div className="space-y-2">
        <Label htmlFor="org_number">Org-nummer (valfri)</Label>
        <Input id="org_number" {...register("org_number")} aria-invalid={!!errors.org_number} />
        <FormError>{errors.org_number?.message}</FormError>
      </div>

      <div className="space-y-2">
        <Label htmlFor="country">Land (ISO-kod, valfri)</Label>
        <Input
          id="country"
          maxLength={2}
          placeholder="SE"
          {...register("country")}
          aria-invalid={!!errors.country}
        />
        <FormError>{errors.country?.message}</FormError>
      </div>

      <FormError>{submitError}</FormError>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Skapar…" : "Skapa organisation"}
      </Button>
    </form>
  );
}

function JoinForm({ onSuccess }: { onSuccess: () => void }) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JoinOrgInput>({
    resolver: zodResolver(joinOrgSchema),
    defaultValues: { token: "" },
  });

  const onSubmit = async (values: JoinOrgInput) => {
    setSubmitError(null);
    const { error } = await supabase.rpc("accept_invitation", { _token: values.token });
    if (error) {
      setSubmitError(error.message);
      return;
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="token">Inbjudningskod</Label>
        <Input
          id="token"
          autoFocus
          autoComplete="off"
          {...register("token")}
          aria-invalid={!!errors.token}
        />
        <FormError>{errors.token?.message}</FormError>
      </div>

      <FormError>{submitError}</FormError>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Går med…" : "Gå med"}
      </Button>
    </form>
  );
}

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useInvalidateProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";
import type { ExperienceRole } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { OnboardingLayout } from "./OnboardingLayout";

interface Props {
  onNext: () => void;
}

const OPTIONS: { value: ExperienceRole; title: string; description: string }[] = [
  { value: "machine_owner", title: "Maskinägare", description: "Du äger och driver maskiner." },
  { value: "service_tech", title: "Servicetekniker", description: "Du underhåller och reparerar maskiner." },
  { value: "oem", title: "Tillverkare / OEM", description: "Du tillverkar maskiner och utrustning." },
  { value: "bank_finance", title: "Bank / Finans", description: "Du finansierar maskiner." },
  { value: "insurance", title: "Försäkring", description: "Du försäkrar maskiner." },
];

export function StepExperienceRole({ onNext }: Props) {
  const { user } = useAuth();
  const invalidate = useInvalidateProfile();
  const [selected, setSelected] = useState<ExperienceRole | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!user || !selected) return;
    setSubmitting(true);
    setSubmitError(null);
    const { error } = await supabase
      .from("profiles")
      .update({ experience_role: selected })
      .eq("user_id", user.id);
    setSubmitting(false);
    if (error) {
      setSubmitError(error.message);
      return;
    }
    await invalidate();
    onNext();
  };

  return (
    <OnboardingLayout
      step={4}
      total={5}
      title="Vad gör du på marknaden?"
      subtitle="Detta personaliserar din vy. Det ändrar inte behörigheter."
    >
      <div role="radiogroup" aria-label="Din roll" className="space-y-2">
        {OPTIONS.map((opt) => {
          const active = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSelected(opt.value)}
              className={cn(
                "w-full text-left p-3 rounded-control border transition-colors ease-standard duration-base min-h-touch",
                active
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-surface-raised hover:bg-surface-track"
              )}
            >
              <div className="text-sm font-medium text-foreground">{opt.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{opt.description}</div>
            </button>
          );
        })}
      </div>

      <FormError>{submitError}</FormError>

      <Button
        type="button"
        onClick={onSubmit}
        disabled={!selected || submitting}
        className="w-full mt-4"
      >
        {submitting ? "Sparar…" : "Fortsätt"}
      </Button>
    </OnboardingLayout>
  );
}

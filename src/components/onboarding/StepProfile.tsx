import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useInvalidateProfile } from "@/hooks/useProfile";
import { profileStepSchema, type ProfileStepInput } from "@/lib/validation/onboarding";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";
import { OnboardingLayout } from "./OnboardingLayout";

interface Props {
  defaultValues?: Partial<ProfileStepInput>;
  onNext: () => void;
}

export function StepProfile({ defaultValues, onNext }: Props) {
  const { user } = useAuth();
  const invalidate = useInvalidateProfile();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileStepInput>({
    resolver: zodResolver(profileStepSchema),
    defaultValues: {
      display_name: defaultValues?.display_name ?? "",
      avatar_url: defaultValues?.avatar_url ?? "",
      language: defaultValues?.language ?? "sv",
    },
  });

  const onSubmit = async (values: ProfileStepInput) => {
    if (!user) return;
    setSubmitError(null);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: values.display_name,
        avatar_url: values.avatar_url || null,
        language: values.language,
      })
      .eq("user_id", user.id);
    if (error) {
      setSubmitError(error.message);
      return;
    }
    await invalidate();
    onNext();
  };

  return (
    <OnboardingLayout
      step={2}
      total={5}
      title="Din profil"
      subtitle="Det här syns för andra i din organisation."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="display_name">Namn</Label>
          <Input
            id="display_name"
            autoFocus
            autoComplete="name"
            {...register("display_name")}
            aria-invalid={!!errors.display_name}
          />
          <FormError>{errors.display_name?.message}</FormError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="avatar_url">Avatar URL (valfri)</Label>
          <Input
            id="avatar_url"
            type="url"
            placeholder="https://..."
            {...register("avatar_url")}
            aria-invalid={!!errors.avatar_url}
          />
          <FormError>{errors.avatar_url?.message}</FormError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">Språk</Label>
          <select
            id="language"
            {...register("language")}
            className="h-11 min-h-touch w-full rounded-input bg-surface-raised text-foreground border border-border px-3 text-sm transition-colors ease-standard duration-base focus:border-primary/40"
          >
            <option value="sv">Svenska</option>
            <option value="en">English</option>
          </select>
        </div>

        <FormError>{submitError}</FormError>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Sparar…" : "Fortsätt"}
        </Button>
      </form>
    </OnboardingLayout>
  );
}

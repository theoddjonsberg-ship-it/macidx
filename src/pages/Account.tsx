import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useInvalidateProfile } from "@/hooks/useProfile";
import {
  profileFormSchema,
  type ProfileFormInput,
  passwordFormSchema,
  type PasswordFormInput,
} from "@/lib/validation/account";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AvatarUpload } from "@/components/account/AvatarUpload";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";
import { Skeleton } from "@/components/ui/Skeleton";

export function Account() {
  return (
    <AppShell>
      <DashboardHeader title="Konto" subtitle="Hantera din profil och säkerhet." />
      <div className="space-y-4 max-w-xl">
        <ProfileCard />
        <PasswordCard />
      </div>
    </AppShell>
  );
}

function ProfileCard() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const invalidate = useInvalidateProfile();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormInput>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { display_name: "" },
    values: profile ? { display_name: profile.display_name ?? "" } : undefined,
  });

  const onSubmit = async (values: ProfileFormInput) => {
    if (!user) return;
    setSubmitError(null);
    setSaved(false);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: values.display_name })
      .eq("user_id", user.id);
    if (error) {
      setSubmitError(error.message);
      return;
    }
    await invalidate();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (isLoading) {
    return (
      <Card>
        <Skeleton className="h-4 w-16 mb-3" />
        <Skeleton className="h-14 w-full mb-4" />
        <Skeleton className="h-10 w-full" />
      </Card>
    );
  }

  return (
    <Card>
      <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
        Profil
      </p>

      <div className="mt-4">
        <AvatarUpload />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6" noValidate>
        <div className="space-y-2">
          <Label htmlFor="display_name">Namn</Label>
          <Input
            id="display_name"
            autoComplete="name"
            {...register("display_name")}
            aria-invalid={!!errors.display_name}
          />
          <FormError>{errors.display_name?.message}</FormError>
        </div>

        <FormError>{submitError}</FormError>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sparar…" : "Spara"}
          </Button>
          {saved && (
            <span className="text-xs text-muted-foreground" role="status">
              Sparat
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}

function PasswordCard() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormInput>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { password: "", confirm: "" },
  });

  const onSubmit = async (values: PasswordFormInput) => {
    setSubmitError(null);
    setSaved(false);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setSubmitError(error.message);
      return;
    }
    reset();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <Card>
      <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
        Lösenord
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-3" noValidate>
        <div className="space-y-2">
          <Label htmlFor="password">Nytt lösenord</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
            aria-invalid={!!errors.password}
          />
          <FormError>{errors.password?.message}</FormError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Bekräfta nytt lösenord</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            {...register("confirm")}
            aria-invalid={!!errors.confirm}
          />
          <FormError>{errors.confirm?.message}</FormError>
        </div>

        <FormError>{submitError}</FormError>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sparar…" : "Uppdatera lösenord"}
          </Button>
          {saved && (
            <span className="text-xs text-muted-foreground" role="status">
              Sparat
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/auth";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";

export function ResetPassword() {
  const navigate = useNavigate();
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) setRecoveryReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (values: ResetPasswordInput) => {
    setSubmitError(null);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setSubmitError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => navigate("/login", { replace: true }), 2000);
  };

  if (done) {
    return (
      <AuthLayout title="Lösenord uppdaterat" subtitle="Du loggas vidare till inloggningen.">
        <p className="text-sm text-muted-foreground">
          Använd ditt nya lösenord nästa gång du loggar in.
        </p>
      </AuthLayout>
    );
  }

  if (!recoveryReady) {
    return (
      <AuthLayout
        title="Återställ lösenord"
        subtitle="Verifierar länken…"
        footer={
          <Link to="/forgot-password" className="text-primary hover:underline">
            Begär en ny länk
          </Link>
        }
      >
        <div className="h-24" aria-busy="true" aria-live="polite" />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Välj nytt lösenord" subtitle="Minst 8 tecken.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="password">Nytt lösenord</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            autoFocus
            {...register("password")}
            aria-invalid={!!errors.password}
          />
          <FormError>{errors.password?.message}</FormError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Bekräfta lösenord</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword")}
            aria-invalid={!!errors.confirmPassword}
          />
          <FormError>{errors.confirmPassword?.message}</FormError>
        </div>

        <FormError>{submitError}</FormError>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Sparar…" : "Spara lösenord"}
        </Button>
      </form>
    </AuthLayout>
  );
}

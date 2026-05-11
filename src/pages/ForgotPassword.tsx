import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation/auth";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";

export function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: ForgotPasswordInput) => {
    setSubmitError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setSubmitError(error.message);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthLayout
        title="Kolla din inkorg"
        subtitle="Om kontot finns har vi skickat en återställningslänk."
        footer={
          <Link to="/login" className="text-primary hover:underline">
            Tillbaka till inloggning
          </Link>
        }
      >
        <p className="text-sm text-muted-foreground">
          Klicka på länken i mejlet för att välja nytt lösenord.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Glömt lösenord"
      subtitle="Ange e-postadressen kopplad till ditt konto."
      footer={
        <Link to="/login" className="text-primary hover:underline">
          Tillbaka till inloggning
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">E-post</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            {...register("email")}
            aria-invalid={!!errors.email}
          />
          <FormError>{errors.email?.message}</FormError>
        </div>

        <FormError>{submitError}</FormError>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Skickar…" : "Skicka återställningslänk"}
        </Button>
      </form>
    </AuthLayout>
  );
}

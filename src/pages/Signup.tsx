import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { signupSchema, type SignupInput } from "@/lib/validation/auth";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";

export function Signup() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (values: SignupInput) => {
    setSubmitError(null);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { emailRedirectTo: `${window.location.origin}/verify-email` },
    });
    if (error) {
      setSubmitError(error.message);
      return;
    }
    setSubmittedEmail(values.email);
  };

  if (submittedEmail) {
    return (
      <AuthLayout
        title="Verifiera din e-post"
        subtitle={`Vi skickade en länk till ${submittedEmail}.`}
        footer={
          <Link to="/login" className="text-primary hover:underline">
            Tillbaka till inloggning
          </Link>
        }
      >
        <p className="text-sm text-muted-foreground">
          Klicka på länken i mejlet för att verifiera kontot. Kolla skräpposten om
          mejlet inte syns inom någon minut.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Skapa konto"
      subtitle="Kom igång med MachIndex."
      footer={
        <span>
          Har du redan ett konto?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Logga in
          </Link>
        </span>
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

        <div className="space-y-2">
          <Label htmlFor="password">Lösenord</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
            aria-invalid={!!errors.password}
            aria-describedby="password-hint"
          />
          <p id="password-hint" className="text-xs text-muted-foreground">
            Minst 8 tecken.
          </p>
          <FormError>{errors.password?.message}</FormError>
        </div>

        <FormError>{submitError}</FormError>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Skapar konto…" : "Skapa konto"}
        </Button>
      </form>
    </AuthLayout>
  );
}

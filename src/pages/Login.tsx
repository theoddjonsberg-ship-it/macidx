import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";

export function Login() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginInput) => {
    setSubmitError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    void supabase.rpc("record_login_attempt", {
      _email: values.email,
      _ip: "",
      _success: !error,
    });

    if (error) {
      setSubmitError(
        error.message === "Invalid login credentials"
          ? "Fel e-post eller lösenord"
          : error.message
      );
      return;
    }
    navigate("/", { replace: true });
  };

  return (
    <AuthLayout
      title="Logga in"
      subtitle="Välkommen tillbaka."
      footer={
        <span>
          Inget konto?{" "}
          <Link to="/signup" className="text-primary hover:underline">
            Skapa ett
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
          <div className="flex items-baseline justify-between">
            <Label htmlFor="password">Lösenord</Label>
            <Link
              to="/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Glömt?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
            aria-invalid={!!errors.password}
          />
          <FormError>{errors.password?.message}</FormError>
        </div>

        <FormError>{submitError}</FormError>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Loggar in…" : "Logga in"}
        </Button>
      </form>
    </AuthLayout>
  );
}

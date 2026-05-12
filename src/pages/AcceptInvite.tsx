import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";

const schema = z.object({
  token: z.string().min(20, "Inbjudningskoden ser ogiltig ut"),
});
type FormInput = z.infer<typeof schema>;

export function AcceptInvite() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: { token: params.get("token") ?? "" },
  });

  useEffect(() => {
    const t = params.get("token");
    if (t) setValue("token", t);
  }, [params, setValue]);

  const onSubmit = async (values: FormInput) => {
    setSubmitError(null);
    const { error } = await supabase.rpc("accept_invitation", { _token: values.token });
    if (error) {
      setSubmitError(error.message);
      return;
    }
    setSuccess(true);
    queryClient.invalidateQueries();
    setTimeout(() => navigate("/team"), 1200);
  };

  return (
    <AppShell>
      <DashboardHeader
        title="Gå med i organisation"
        subtitle="Klistra in inbjudningskoden du fått. Du läggs då till som medlem."
      />
      <Card className="max-w-md">
        {success ? (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-coin bg-primary/15 flex items-center justify-center shrink-0">
              <Check className="h-5 w-5 text-primary" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Du är nu medlem</p>
              <p className="text-xs text-muted-foreground">Omdirigerar till team…</p>
            </div>
          </div>
        ) : (
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
        )}
      </Card>
    </AppShell>
  );
}

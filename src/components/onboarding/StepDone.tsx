import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useInvalidateProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { OnboardingLayout } from "./OnboardingLayout";

export function StepDone() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const invalidate = useInvalidateProfile();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !user) return;
    ran.current = true;

    (async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq("user_id", user.id);
      if (error) {
        setError(error.message);
        return;
      }
      await invalidate();
      setTimeout(() => navigate("/", { replace: true }), 1200);
    })();
  }, [user, invalidate, navigate]);

  return (
    <OnboardingLayout
      step={5}
      total={5}
      title="Allt klart"
      subtitle="Du loggas in till din dashboard."
    >
      {error ? (
        <>
          <FormError>{error}</FormError>
          <Button
            type="button"
            onClick={() => navigate("/", { replace: true })}
            className="w-full mt-4"
          >
            Till startsidan
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Förbereder ditt konto…</p>
      )}
    </OnboardingLayout>
  );
}

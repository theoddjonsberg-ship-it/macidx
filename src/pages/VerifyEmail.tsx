import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";

type Status = "checking" | "verified" | "pending" | "error";

export function VerifyEmail() {
  const [status, setStatus] = useState<Status>("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handle = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setStatus("error");
        setErrorMessage(error.message);
        return;
      }
      if (data.session?.user.email_confirmed_at) {
        setStatus("verified");
        return;
      }
      setStatus("pending");
    };
    handle();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user.email_confirmed_at) {
        setStatus("verified");
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (status === "checking") {
    return (
      <AuthLayout title="Verifierar…" subtitle="Ett ögonblick.">
        <div className="h-24" aria-busy="true" aria-live="polite" />
      </AuthLayout>
    );
  }

  if (status === "verified") {
    return (
      <AuthLayout title="E-post verifierad" subtitle="Du kan nu fortsätta till onboarding.">
        <Button asChild className="w-full">
          <Link to="/onboarding">Fortsätt</Link>
        </Button>
      </AuthLayout>
    );
  }

  if (status === "error") {
    return (
      <AuthLayout
        title="Något gick fel"
        subtitle={errorMessage ?? "Länken kan vara förbrukad."}
        footer={
          <Link to="/login" className="text-primary hover:underline">
            Tillbaka till inloggning
          </Link>
        }
      >
        <p className="text-sm text-muted-foreground">
          Försök logga in igen så skickas en ny verifieringslänk vid behov.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Inväntar verifiering"
      subtitle="Klicka på länken i e-postmeddelandet."
      footer={
        <Link to="/login" className="text-primary hover:underline">
          Tillbaka till inloggning
        </Link>
      }
    >
      <p className="text-sm text-muted-foreground">
        Den här sidan uppdateras automatiskt när du verifierat e-posten.
      </p>
    </AuthLayout>
  );
}

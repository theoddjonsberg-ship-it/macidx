import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { StepWelcome } from "@/components/onboarding/StepWelcome";
import { StepProfile } from "@/components/onboarding/StepProfile";
import { StepOrganization } from "@/components/onboarding/StepOrganization";
import { StepExperienceRole } from "@/components/onboarding/StepExperienceRole";
import { StepDone } from "@/components/onboarding/StepDone";

export function Onboarding() {
  const { data: profile, isLoading } = useProfile();
  const [step, setStep] = useState(1);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" aria-busy="true" aria-live="polite" />
    );
  }

  if (profile?.onboarding_completed_at) {
    return <Navigate to="/" replace />;
  }

  const next = () => setStep((s) => Math.min(s + 1, 5));

  if (step === 1) return <StepWelcome onNext={next} />;
  if (step === 2) {
    return (
      <StepProfile
        defaultValues={{
          display_name: profile?.display_name ?? "",
          avatar_url: profile?.avatar_url ?? "",
          language: profile?.language ?? "sv",
        }}
        onNext={next}
      />
    );
  }
  if (step === 3) return <StepOrganization onNext={next} />;
  if (step === 4) return <StepExperienceRole onNext={next} />;
  return <StepDone />;
}

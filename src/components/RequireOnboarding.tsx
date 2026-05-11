import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";

export function RequireOnboarding({ children }: { children: ReactNode }) {
  const { data: profile, isLoading } = useProfile();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" aria-busy="true" aria-live="polite" />
    );
  }

  if (!profile || !profile.onboarding_completed_at) {
    return <Navigate to="/onboarding" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

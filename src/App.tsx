import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { RequireAuth } from "@/components/RequireAuth";
import { RequireGuest } from "@/components/RequireGuest";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { Login } from "@/pages/Login";
import { Signup } from "@/pages/Signup";
import { ForgotPassword } from "@/pages/ForgotPassword";
import { ResetPassword } from "@/pages/ResetPassword";
import { VerifyEmail } from "@/pages/VerifyEmail";
import { Onboarding } from "@/pages/Onboarding";
import { Dashboard } from "@/pages/Dashboard";
import { Team } from "@/pages/Team";
import { Account } from "@/pages/Account";
import { Organization } from "@/pages/Organization";
import { Forbidden } from "@/pages/Forbidden";
import { NotFound } from "@/pages/NotFound";
import { Audit } from "@/pages/Audit";
import { Placeholder } from "@/pages/Placeholder";
import { AppShell } from "@/components/layout/AppShell";

function Authed({ title }: { title: string }) {
  return (
    <AppShell>
      <Placeholder title={title} />
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
        <Route path="/signup" element={<RequireGuest><Signup /></RequireGuest>} />
        <Route path="/forgot-password" element={<RequireGuest><ForgotPassword /></RequireGuest>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />

        <Route path="/" element={<RequireAuth><RequireOnboarding><Dashboard /></RequireOnboarding></RequireAuth>} />
        <Route path="/team" element={<RequireAuth><RequireOnboarding><Team /></RequireOnboarding></RequireAuth>} />
        <Route path="/account" element={<RequireAuth><RequireOnboarding><Account /></RequireOnboarding></RequireAuth>} />
        <Route path="/organization" element={<RequireAuth><RequireOnboarding><Organization /></RequireOnboarding></RequireAuth>} />
        <Route path="/audit" element={<RequireAuth><RequireOnboarding><Audit /></RequireOnboarding></RequireAuth>} />
        <Route path="/notifications" element={<RequireAuth><RequireOnboarding><Authed title="Notifications" /></RequireOnboarding></RequireAuth>} />

        <Route path="/403" element={<Forbidden />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </AuthProvider>
  );
}

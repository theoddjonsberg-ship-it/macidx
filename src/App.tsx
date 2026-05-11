import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { RequireAuth } from "@/components/RequireAuth";
import { RequireGuest } from "@/components/RequireGuest";
import { Login } from "@/pages/Login";
import { Signup } from "@/pages/Signup";
import { ForgotPassword } from "@/pages/ForgotPassword";
import { ResetPassword } from "@/pages/ResetPassword";
import { VerifyEmail } from "@/pages/VerifyEmail";
import { Forbidden } from "@/pages/Forbidden";
import { NotFound } from "@/pages/NotFound";
import { Placeholder } from "@/pages/Placeholder";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
        <Route path="/signup" element={<RequireGuest><Signup /></RequireGuest>} />
        <Route path="/forgot-password" element={<RequireGuest><ForgotPassword /></RequireGuest>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route path="/" element={<RequireAuth><Placeholder title="Dashboard" /></RequireAuth>} />
        <Route path="/onboarding" element={<RequireAuth><Placeholder title="Onboarding" /></RequireAuth>} />
        <Route path="/organization" element={<RequireAuth><Placeholder title="Organization" /></RequireAuth>} />
        <Route path="/team" element={<RequireAuth><Placeholder title="Team" /></RequireAuth>} />
        <Route path="/account" element={<RequireAuth><Placeholder title="Account" /></RequireAuth>} />
        <Route path="/audit" element={<RequireAuth><Placeholder title="Audit" /></RequireAuth>} />
        <Route path="/notifications" element={<RequireAuth><Placeholder title="Notifications" /></RequireAuth>} />

        <Route path="/403" element={<Forbidden />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </AuthProvider>
  );
}

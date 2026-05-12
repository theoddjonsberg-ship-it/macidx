import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { RequireAuth } from "@/components/RequireAuth";
import { RequireGuest } from "@/components/RequireGuest";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { RoleRouter } from "@/components/RoleRouter";
import { Login } from "@/pages/Login";
import { Signup } from "@/pages/Signup";
import { ForgotPassword } from "@/pages/ForgotPassword";
import { ResetPassword } from "@/pages/ResetPassword";
import { VerifyEmail } from "@/pages/VerifyEmail";
import { Onboarding } from "@/pages/Onboarding";
import { Team } from "@/pages/Team";
import { Account } from "@/pages/Account";
import { Organization } from "@/pages/Organization";
import { Audit } from "@/pages/Audit";
import { Notifications } from "@/pages/Notifications";
import { AcceptInvite } from "@/pages/AcceptInvite";
import { AcceptInviteById } from "@/pages/AcceptInviteById";
import { Machines } from "@/pages/Machines";
import { AddMachine } from "@/pages/AddMachine";
import { MachineProfile } from "@/pages/MachineProfile";
import { InsuranceDashboard } from "@/pages/partner/InsuranceDashboard";
import { FinanceDashboard } from "@/pages/partner/FinanceDashboard";
import { PartnerCustomers } from "@/pages/partner/PartnerCustomers";
import { PartnerCustomerDetail } from "@/pages/partner/PartnerCustomerDetail";
import { PartnerQuotes } from "@/pages/partner/PartnerQuotes";
import { PartnerQuoteDetail } from "@/pages/partner/PartnerQuoteDetail";
import { PartnerQuoteReport } from "@/pages/partner/PartnerQuoteReport";
import { QuoteWizard } from "@/pages/partner/QuoteWizard";
import { TechnicianDashboard } from "@/pages/TechnicianDashboard";
import { Forbidden } from "@/pages/Forbidden";
import { NotFound } from "@/pages/NotFound";

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

        <Route path="/" element={<RequireAuth><RequireOnboarding><RoleRouter /></RequireOnboarding></RequireAuth>} />
        <Route path="/team" element={<RequireAuth><RequireOnboarding><Team /></RequireOnboarding></RequireAuth>} />
        <Route path="/account" element={<RequireAuth><RequireOnboarding><Account /></RequireOnboarding></RequireAuth>} />
        <Route path="/organization" element={<RequireAuth><RequireOnboarding><Organization /></RequireOnboarding></RequireAuth>} />
        <Route path="/audit" element={<RequireAuth><RequireOnboarding><Audit /></RequireOnboarding></RequireAuth>} />
        <Route path="/notifications" element={<RequireAuth><RequireOnboarding><Notifications /></RequireOnboarding></RequireAuth>} />
        <Route path="/machines" element={<RequireAuth><RequireOnboarding><Machines /></RequireOnboarding></RequireAuth>} />
        <Route path="/machines/add" element={<RequireAuth><RequireOnboarding><AddMachine /></RequireOnboarding></RequireAuth>} />
        <Route path="/machines/:id" element={<RequireAuth><RequireOnboarding><MachineProfile /></RequireOnboarding></RequireAuth>} />
        <Route path="/partner/insurance" element={<RequireAuth><RequireOnboarding><InsuranceDashboard /></RequireOnboarding></RequireAuth>} />
        <Route path="/partner/finance" element={<RequireAuth><RequireOnboarding><FinanceDashboard /></RequireOnboarding></RequireAuth>} />
        <Route path="/partner/customers" element={<RequireAuth><RequireOnboarding><PartnerCustomers /></RequireOnboarding></RequireAuth>} />
        <Route path="/partner/customers/:orgId" element={<RequireAuth><RequireOnboarding><PartnerCustomerDetail /></RequireOnboarding></RequireAuth>} />
        <Route path="/partner/quotes" element={<RequireAuth><RequireOnboarding><PartnerQuotes /></RequireOnboarding></RequireAuth>} />
        <Route path="/partner/quotes/:id" element={<RequireAuth><RequireOnboarding><PartnerQuoteDetail /></RequireOnboarding></RequireAuth>} />
        <Route path="/partner/quotes/:id/report" element={<RequireAuth><RequireOnboarding><PartnerQuoteReport /></RequireOnboarding></RequireAuth>} />
        <Route path="/partner/quote/new" element={<RequireAuth><RequireOnboarding><QuoteWizard /></RequireOnboarding></RequireAuth>} />
        <Route path="/technician" element={<RequireAuth><RequireOnboarding><TechnicianDashboard /></RequireOnboarding></RequireAuth>} />
        <Route path="/accept-invite" element={<RequireAuth><AcceptInvite /></RequireAuth>} />
        <Route path="/invite/:id" element={<RequireAuth><AcceptInviteById /></RequireAuth>} />

        <Route path="/403" element={<Forbidden />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </AuthProvider>
  );
}

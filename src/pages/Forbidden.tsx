import { Link } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";

export function Forbidden() {
  return (
    <AuthLayout
      title="403 — Åtkomst nekad"
      subtitle="Du har inte behörighet att se den här sidan."
      footer={
        <Link to="/" className="text-primary hover:underline">
          Till startsidan
        </Link>
      }
    >
      <p className="text-sm text-muted-foreground">
        Kontakta din organisations ägare om du tror att detta är fel.
      </p>
    </AuthLayout>
  );
}

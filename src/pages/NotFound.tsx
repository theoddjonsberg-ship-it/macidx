import { Link } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";

export function NotFound() {
  return (
    <AuthLayout
      title="404 — Sidan hittades inte"
      subtitle="Länken kan ha flyttats eller tagits bort."
      footer={
        <Link to="/" className="text-primary hover:underline">
          Till startsidan
        </Link>
      }
    >
      <p className="text-sm text-muted-foreground">
        Kontrollera adressen eller gå tillbaka.
      </p>
    </AuthLayout>
  );
}

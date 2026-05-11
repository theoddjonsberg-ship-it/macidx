import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useProfile } from "@/hooks/useProfile";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import type { ExperienceRole } from "@/types/database";

const ROLE_COPY: Record<ExperienceRole | "default", string> = {
  machine_owner: "Få översikt över din maskinpark.",
  service_tech: "Hantera servicearbete och loggar.",
  oem: "Följ dina tillverkade enheter i marknaden.",
  bank_finance: "Verifiera tillgångar du finansierar.",
  insurance: "Verifiera tillgångar du försäkrar.",
  default: "Maskinregistret kommer i v0.2.",
};

export function WelcomeCard() {
  const { data: profile, isLoading: pLoading } = useProfile();
  const { data: org, isLoading: oLoading } = useActiveOrg();

  if (pLoading || oLoading) {
    return (
      <Card>
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-6 w-40 mb-2" />
        <Skeleton className="h-4 w-56" />
      </Card>
    );
  }

  const copy = profile?.experience_role
    ? ROLE_COPY[profile.experience_role]
    : ROLE_COPY.default;

  return (
    <Card>
      <p className="font-condensed text-xs tracking-widest uppercase text-muted-foreground">
        Välkommen
      </p>
      <h2 className="text-lg font-semibold mt-1">
        {profile?.display_name || "Användare"}
      </h2>
      <p className="text-sm text-muted-foreground mt-1">
        {org ? `Aktiv organisation: ${org.name}` : "Ingen organisation"}
      </p>
      <p className="text-sm mt-3">{copy}</p>
    </Card>
  );
}

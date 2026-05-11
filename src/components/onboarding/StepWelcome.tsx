import { Button } from "@/components/ui/Button";
import { OnboardingLayout } from "./OnboardingLayout";

interface Props {
  onNext: () => void;
}

export function StepWelcome({ onNext }: Props) {
  return (
    <OnboardingLayout
      step={1}
      total={5}
      title="Välkommen till MachIndex"
      subtitle="Vi sätter upp ditt konto och din organisation i fem korta steg."
    >
      <ul className="space-y-3 text-sm text-foreground">
        <li>1. Din profil</li>
        <li>2. Din organisation</li>
        <li>3. Vilken roll du har på marknaden</li>
        <li>4. Klart att börja använda MachIndex</li>
      </ul>
      <Button type="button" onClick={onNext} className="w-full mt-6">
        Kom igång
      </Button>
    </OnboardingLayout>
  );
}

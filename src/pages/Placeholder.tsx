import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

interface PlaceholderProps {
  title: string;
}

export function Placeholder({ title }: PlaceholderProps) {
  const { signOut, user } = useAuth();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <p className="font-condensed text-xs tracking-widest uppercase text-muted-foreground mb-2">
          MachIndex
        </p>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Den här vyn implementeras i ett senare steg.
        </p>
        {user?.email && (
          <p className="mt-6 text-sm text-muted-foreground font-mono">{user.email}</p>
        )}
        <Button variant="secondary" onClick={signOut} className="mt-4">
          Logga ut
        </Button>
      </div>
    </div>
  );
}

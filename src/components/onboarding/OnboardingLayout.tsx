import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface OnboardingLayoutProps {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function OnboardingLayout({
  step,
  total,
  title,
  subtitle,
  children,
}: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="px-4 pt-6">
        <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
          MachIndex · Onboarding
        </p>
        <ol className="mt-3 flex gap-1.5" aria-label={`Steg ${step} av ${total}`}>
          {Array.from({ length: total }).map((_, i) => (
            <li
              key={i}
              aria-current={i + 1 === step ? "step" : undefined}
              className={cn(
                "h-1 flex-1 rounded-full",
                i + 1 <= step ? "bg-primary" : "bg-surface-track"
              )}
            />
          ))}
        </ol>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
            {subtitle && (
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="bg-card text-card-foreground border border-border rounded-surface p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

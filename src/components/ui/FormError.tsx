import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormErrorProps {
  children?: ReactNode;
  className?: string;
}

export function FormError({ children, className }: FormErrorProps) {
  if (!children) return null;
  return (
    <p
      role="alert"
      aria-live="polite"
      className={cn("text-sm text-destructive", className)}
    >
      {children}
    </p>
  );
}

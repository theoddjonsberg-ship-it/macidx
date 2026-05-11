import { forwardRef, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "bg-surface-raised border border-border shadow-soft-raised",
  {
    variants: {
      variant: {
        base: "rounded-xl p-4",
        compact: "rounded-xl p-3",
        feature: "rounded-2xl p-5",
      },
    },
    defaultVariants: { variant: "base" },
  }
);

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant }), className)} {...props} />
  )
);
Card.displayName = "Card";

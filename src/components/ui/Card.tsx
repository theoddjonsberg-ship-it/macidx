import { forwardRef, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva("bg-card text-card-foreground border border-border", {
  variants: {
    variant: {
      base: "rounded-surface p-4",
      compact: "rounded-surface p-3",
      feature: "rounded-surface p-5",
    },
  },
  defaultVariants: { variant: "base" },
});

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant }), className)} {...props} />
  )
);
Card.displayName = "Card";

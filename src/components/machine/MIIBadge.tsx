import { cn } from "@/lib/utils";
import type { MiiLevel } from "@/types/database";
import { miiLevelTone, miiLevelLabels } from "@/lib/machine-utils";

interface MIIBadgeProps {
  level: MiiLevel;
  variant?: "compact" | "full";
  className?: string;
}

export function MIIBadge({ level, variant = "compact", className }: MIIBadgeProps) {
  const tone = miiLevelTone(level);

  if (variant === "compact") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
          tone,
          className
        )}
      >
        {level}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        tone,
        className
      )}
    >
      <span className="font-semibold">{level}</span>
      <span className="text-[10px] opacity-80">{miiLevelLabels[level].split(" — ")[1]}</span>
    </span>
  );
}

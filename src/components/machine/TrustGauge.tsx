import { cn } from "@/lib/utils";

interface TrustGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TrustGauge({ score, size = "md", className }: TrustGaugeProps) {
  // Clamp score to 0-100
  const clamped = Math.max(0, Math.min(100, score));

  // Size mappings
  const sizeMap = {
    sm: { outer: 64, inner: 52, stroke: 6, text: "text-lg" },
    md: { outer: 96, inner: 78, stroke: 9, text: "text-2xl" },
    lg: { outer: 128, inner: 104, stroke: 12, text: "text-3xl" },
  };
  const s = sizeMap[size];

  // Calculate the conic gradient angle (0-360)
  const angle = (clamped / 100) * 360;

  // Color based on score
  const getColor = (val: number) => {
    if (val >= 70) return "var(--primary)";
    if (val >= 40) return "var(--warning)";
    return "var(--muted-foreground)";
  };

  const color = getColor(clamped);

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: s.outer, height: s.outer }}
    >
      {/* Background ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(
            ${color} 0deg ${angle}deg,
            var(--muted) ${angle}deg 360deg
          )`,
        }}
      />
      {/* Inner circle to create ring effect */}
      <div
        className="absolute bg-card rounded-full flex items-center justify-center"
        style={{
          width: s.inner,
          height: s.inner,
        }}
      >
        <span className={cn("font-semibold tabular-nums", s.text)} style={{ color }}>
          {clamped}
        </span>
      </div>
    </div>
  );
}

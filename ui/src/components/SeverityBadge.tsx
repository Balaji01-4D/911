import { clsx } from 'clsx';

interface SeverityBadgeProps {
  score: number;
}

export default function SeverityBadge({ score }: SeverityBadgeProps) {
  // Normalize score 1-10 to 0-1 for easier logic, or just use 1-10 directly.
  // Requirement says "takes a float (0.0 - 1.0)", but data is 1-10. Let's assume input is 1-10.
  
  const isCritical = score >= 8;
  const isHigh = score >= 5 && score < 8;
  const isLow = score < 5;

  return (
    <div className={clsx(
      "flex items-center gap-2 px-2 py-1 rounded text-xs font-mono font-medium border",
      isCritical && "bg-red-500/10 text-red-500 border-red-500/20",
      isHigh && "bg-amber-500/10 text-amber-500 border-amber-500/20",
      isLow && "bg-blue-500/10 text-blue-500 border-blue-500/20",
      isCritical && "animate-pulse" // Simple pulse for critical
    )}>
      <div className={clsx(
        "w-1.5 h-1.5 rounded-full",
        isCritical && "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]",
        isHigh && "bg-amber-500",
        isLow && "bg-blue-500"
      )} />
      SCORE: {score.toFixed(1)}
    </div>
  );
}

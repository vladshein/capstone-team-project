import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}

export function StatCard({ icon: Icon, label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-bg p-5 shadow-sm">
      <div className="flex items-center gap-2 text-text-muted">
        <Icon className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="mt-3 font-heading text-2xl font-bold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-text-subtle">{hint}</p>}
    </div>
  );
}

export default StatCard;

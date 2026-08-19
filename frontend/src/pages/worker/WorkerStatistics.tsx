import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  Hourglass,
  Percent,
  Wallet,
  XCircle,
} from "lucide-react";
import type { StatisticsSummary } from "../../redux/worker-statistics/types";

interface WorkerStatisticsProps {
  summary: StatisticsSummary;
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}) {
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

const currencyFormatter = new Intl.NumberFormat("uk-UA", {
  maximumFractionDigits: 0,
});

export function WorkerStatistics({ summary }: WorkerStatisticsProps) {
  const { applications, shifts, companiesWorkedFor, attendance, wallet } =
    summary;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-heading text-lg font-bold">Заявки</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={Briefcase}
            label="Усього заявок"
            value={String(applications.total)}
          />
          <StatCard
            icon={Hourglass}
            label="На розгляді"
            value={String(applications.pending)}
          />
          <StatCard
            icon={CheckCircle2}
            label="Схвалено"
            value={String(applications.approved)}
          />
          <StatCard
            icon={XCircle}
            label="Відхилено"
            value={String(applications.rejected)}
          />
          <StatCard
            icon={CheckCircle2}
            label="Завершено"
            value={String(applications.completed)}
          />
          <StatCard
            icon={XCircle}
            label="Неявка"
            value={String(applications.noShow)}
          />
        </div>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold">Зміни</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={CheckCircle2}
            label="Завершено змін"
            value={String(shifts.completed)}
          />
          <StatCard
            icon={Clock}
            label="Заплановано"
            value={String(shifts.upcoming)}
          />
          <StatCard
            icon={Hourglass}
            label="Відпрацьовано годин"
            value={shifts.scheduledCompletedHours.toFixed(1)}
          />
          <StatCard
            icon={Wallet}
            label="Орієнтовний заробіток"
            value={`${currencyFormatter.format(shifts.estimatedCompletedEarnings)} ₴`}
          />
        </div>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold">Загальне</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={Building2}
            label="Компаній"
            value={String(companiesWorkedFor)}
          />
          <StatCard
            icon={Percent}
            label="Відвідуваність"
            value={`${attendance.rate.toFixed(0)}%`}
            hint={`${attendance.completed} відвідано · ${attendance.noShow} неявок`}
          />
          {wallet && (
            <StatCard
              icon={Wallet}
              label="Баланс гаманця"
              value={`${currencyFormatter.format(wallet.balance)} ₴`}
              hint={
                wallet.frozenBalance > 0
                  ? `${currencyFormatter.format(wallet.frozenBalance)} ₴ заморожено`
                  : undefined
              }
            />
          )}
        </div>
      </section>
    </div>
  );
}
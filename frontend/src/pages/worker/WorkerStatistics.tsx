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
import { StatCard } from "../../components/ui/StatCard";

interface WorkerStatisticsProps {
  summary: StatisticsSummary;
}

const currencyFormatter = new Intl.NumberFormat("uk-UA", {
  maximumFractionDigits: 0,
});

export function WorkerStatistics({ summary }: WorkerStatisticsProps) {
  const { applications, shifts, companiesWorkedFor, attendance } = summary;

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
        </div>
      </section>
    </div>
  );
}
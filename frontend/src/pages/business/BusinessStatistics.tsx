import {
  Ban,
  CheckCircle2,
  ClipboardList,
  Clock,
  Hourglass,
  PlayCircle,
  Users,
  UserCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import type { BusinessStatisticsSummary } from "../../redux/business-statistics/types";
import { StatCard } from "../../components/ui/StatCard";

interface BusinessStatisticsProps {
  summary: BusinessStatisticsSummary;
}

const currencyFormatter = new Intl.NumberFormat("uk-UA", {
  maximumFractionDigits: 0,
});

export function BusinessStatistics({ summary }: BusinessStatisticsProps) {
  const { shifts, applications, workers, money } = summary;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-heading text-lg font-bold">Зміни</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard icon={ClipboardList} label="Усього змін" value={String(shifts.total)} />
          <StatCard icon={Clock} label="Відкриті" value={String(shifts.open)} />
          <StatCard icon={Hourglass} label="Заброньовані" value={String(shifts.booked)} />
          <StatCard icon={PlayCircle} label="У процесі" value={String(shifts.inProgress)} />
          <StatCard icon={CheckCircle2} label="Завершені" value={String(shifts.completed)} />
          <StatCard icon={Ban} label="Скасовані" value={String(shifts.cancelled)} />
        </div>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold">Заявки</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard icon={ClipboardList} label="Усього заявок" value={String(applications.total)} />
          <StatCard icon={Hourglass} label="На розгляді" value={String(applications.pending)} />
          <StatCard icon={CheckCircle2} label="Схвалено" value={String(applications.approved)} />
          <StatCard icon={XCircle} label="Відхилено" value={String(applications.rejected)} />
          <StatCard icon={CheckCircle2} label="Виконано" value={String(applications.completed)} />
          <StatCard icon={XCircle} label="Неявка" value={String(applications.noShow)} />
        </div>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold">Воркери та гроші</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard icon={Users} label="Подавали заявки" value={String(workers.applied)} />
          <StatCard icon={UserCheck} label="Працювали" value={String(workers.worked)} />
          <StatCard
            icon={Wallet}
            label="Орієнтовні виплати"
            value={`${currencyFormatter.format(money.totalPaidOut)} ₴`}
            hint="Оцінка за ставкою і бонусом завершених змін"
          />
          {money.wallet && (
            <StatCard
              icon={Wallet}
              label="Баланс гаманця"
              value={`${currencyFormatter.format(money.wallet.balance)} ₴`}
              hint={
                money.wallet.frozenBalance > 0
                  ? `${currencyFormatter.format(money.wallet.frozenBalance)} ₴ заморожено`
                  : undefined
              }
            />
          )}
        </div>
      </section>
    </div>
  );
}

export default BusinessStatistics;

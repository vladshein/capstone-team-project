import { useCallback, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { selectCompanies } from "../../redux/companies-profile/selectors";
import {
  fetchBusinessStatisticsSummary,
  fetchBusinessShiftsStatistics,
  fetchBusinessWorkersStatistics,
} from "../../redux/business-statistics/actions";
import {
  selectBusinessStatisticsSummary,
  selectIsBusinessSummaryLoading,
  selectBusinessSummaryError,
  selectBusinessShiftsStatistics,
  selectIsBusinessShiftsStatisticsLoading,
  selectBusinessShiftsStatisticsError,
  selectBusinessWorkersStatistics,
  selectIsBusinessWorkersLoading,
  selectBusinessWorkersError,
} from "../../redux/business-statistics/selectors";
import type { GroupBy } from "../../redux/business-statistics/types";
import { Loader } from "../../components/ui/Loader";
import { BusinessStatistics } from "./BusinessStatistics";
import { BusinessShiftsDynamics } from "./BusinessShiftsDynamics";
import { BusinessWorkersTable } from "./BusinessWorkersTable";

const WORKERS_PER_PAGE = 10;

export function BusinessStatisticsPage() {
  const dispatch = useAppDispatch();
  const companies = useAppSelector(selectCompanies);

  const summary = useAppSelector(selectBusinessStatisticsSummary);
  const isSummaryLoading = useAppSelector(selectIsBusinessSummaryLoading);
  const summaryError = useAppSelector(selectBusinessSummaryError);

  const shiftsStatistics = useAppSelector(selectBusinessShiftsStatistics);
  const isShiftsLoading = useAppSelector(selectIsBusinessShiftsStatisticsLoading);
  const shiftsError = useAppSelector(selectBusinessShiftsStatisticsError);

  const workers = useAppSelector(selectBusinessWorkersStatistics);
  const isWorkersLoading = useAppSelector(selectIsBusinessWorkersLoading);
  const workersError = useAppSelector(selectBusinessWorkersError);

  // null = "Усі компанії" — власний скоуп цієї сторінки, незалежний від
  // activeCompany у шапці кабінету (та керує лише вкладками змін/заявок).
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>("month");
  const [workersPage, setWorkersPage] = useState(1);

  const loadSummary = useCallback(() => {
    void dispatch(fetchBusinessStatisticsSummary({ companyId: companyId ?? undefined }));
  }, [dispatch, companyId]);

  const loadShiftsStatistics = useCallback(
    (nextGroupBy: GroupBy) => {
      void dispatch(
        fetchBusinessShiftsStatistics({ groupBy: nextGroupBy, companyId: companyId ?? undefined }),
      );
    },
    [dispatch, companyId],
  );

  const loadWorkers = useCallback(
    (page: number) => {
      void dispatch(
        fetchBusinessWorkersStatistics({
          companyId: companyId ?? undefined,
          page,
          limit: WORKERS_PER_PAGE,
        }),
      );
    },
    [dispatch, companyId],
  );

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadShiftsStatistics(groupBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupBy, companyId]);

  useEffect(() => {
    setWorkersPage(1);
    loadWorkers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const handleWorkersPageChange = (page: number) => {
    setWorkersPage(page);
    loadWorkers(page);
  };

  const isInitialLoading = isSummaryLoading && !summary;

  if (isInitialLoading) {
    return <Loader label="Завантажуємо статистику…" size="lg" />;
  }

  if (summaryError && !summary) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm text-danger">{summaryError}</p>
        <button
          type="button"
          onClick={loadSummary}
          disabled={isSummaryLoading}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-bg-muted disabled:opacity-50"
        >
          {isSummaryLoading ? "Завантаження…" : "Спробувати ще раз"}
        </button>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-bold tracking-tight">Статистика</h1>

        {companies.length > 0 && (
          <label className="flex cursor-pointer flex-col">
            <span className="text-xs text-text-subtle">Компанія</span>
            <span className="relative mt-0.5 inline-flex items-center">
              <select
                value={companyId ?? "all"}
                onChange={(event) =>
                  setCompanyId(event.target.value === "all" ? null : Number(event.target.value))
                }
                className="min-h-[36px] cursor-pointer appearance-none rounded-[var(--radius-pill)] border border-border bg-bg py-1 pl-3 pr-9 text-sm font-medium text-text outline-none transition-colors hover:border-accent focus:border-accent"
              >
                <option value="all">Усі компанії ({summary.companies.total})</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-text-subtle" />
            </span>
          </label>
        )}
      </div>

      <div className="mt-6">
        <BusinessStatistics summary={summary} />
      </div>

      <div className="mt-10">
        <BusinessShiftsDynamics
          data={shiftsStatistics}
          isLoading={isShiftsLoading}
          error={shiftsError}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          onRetry={() => loadShiftsStatistics(groupBy)}
        />
      </div>

      <section className="mt-10">
        <h2 className="font-heading text-lg font-bold">Воркери</h2>
        <div className="mt-4">
          <BusinessWorkersTable
            data={workers}
            isLoading={isWorkersLoading}
            error={workersError}
            page={workersPage}
            onPageChange={handleWorkersPageChange}
            onRetry={() => loadWorkers(workersPage)}
          />
        </div>
      </section>
    </div>
  );
}

export default BusinessStatisticsPage;

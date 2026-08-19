import { useCallback, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  fetchStatisticsSummary,
  fetchShiftsStatistics,
} from "../../redux/worker-statistics/actions";
import {
  selectStatisticsSummary,
  selectIsSummaryLoading,
  selectSummaryError,
  selectShiftsStatistics,
  selectIsShiftsStatisticsLoading,
  selectShiftsStatisticsError,
} from "../../redux/worker-statistics/selectors";
import type { GroupBy } from "../../redux/worker-statistics/types";
import { Loader } from "../../components/ui/Loader";
import { WorkerStatistics } from "./WorkerStatistics";
import { WorkerShiftsDynamics } from "./WorkerShiftsDynamics";

export function WorkerStatisticsPage() {
  const dispatch = useAppDispatch();

  const summary = useAppSelector(selectStatisticsSummary);
  const isSummaryLoading = useAppSelector(selectIsSummaryLoading);
  const summaryError = useAppSelector(selectSummaryError);

  const shiftsStatistics = useAppSelector(selectShiftsStatistics);
  const isShiftsLoading = useAppSelector(selectIsShiftsStatisticsLoading);
  const shiftsError = useAppSelector(selectShiftsStatisticsError);

  const [groupBy, setGroupBy] = useState<GroupBy>("month");

  const loadSummary = useCallback(() => {
    void dispatch(fetchStatisticsSummary({}));
  }, [dispatch]);

  const loadShiftsStatistics = useCallback(
    (nextGroupBy: GroupBy) => {
      void dispatch(fetchShiftsStatistics({ groupBy: nextGroupBy }));
    },
    [dispatch],
  );

  // summary — вантажимо один раз, як і раніше
  useEffect(() => {
    if (!summary) loadSummary();
  }, [summary, loadSummary]);

  // shiftsStatistics — окремий домен, перевантажується при зміні groupBy
  useEffect(() => {
    loadShiftsStatistics(groupBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupBy]);

  const isInitialLoading = isSummaryLoading && !summary;

  if (isInitialLoading) {
    return <Loader label="Завантажуємо статистику…" size="lg" fullScreen />;
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
    <div className="mx-auto max-w-7xl px-4 py-[var(--space-section)] sm:px-6 md:px-8">
      <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
        Моя статистика
      </h1>

      <div className="mt-6">
        <WorkerStatistics summary={summary} />
      </div>

      <div className="mt-10">
        <WorkerShiftsDynamics
          data={shiftsStatistics}
          isLoading={isShiftsLoading}
          error={shiftsError}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          onRetry={() => loadShiftsStatistics(groupBy)}
        />
      </div>
    </div>
  );
}

export default WorkerStatisticsPage;
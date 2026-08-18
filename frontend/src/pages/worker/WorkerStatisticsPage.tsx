import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchStatisticsSummary } from "../../redux/worker-statistics/actions";
import {
  selectStatisticsSummary,
  selectIsSummaryLoading,
  selectSummaryError,
} from "../../redux/worker-statistics/selectors";
import { Loader } from "../../components/ui/Loader";
import { WorkerStatistics } from "./WorkerStatistics";

export function WorkerStatisticsPage() {
  const dispatch = useAppDispatch();
  const summary = useAppSelector(selectStatisticsSummary);
  const isLoading = useAppSelector(selectIsSummaryLoading);
  const error = useAppSelector(selectSummaryError);

  const loadSummary = useCallback(() => {
    void dispatch(fetchStatisticsSummary({}));
  }, [dispatch]);

  useEffect(() => {
    if (!summary) {
      loadSummary();
    }
  }, [summary, loadSummary]);

  if (isLoading && !summary) {
    return <Loader label="Завантажуємо статистику…" size="lg" fullScreen />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm text-danger">{error}</p>
        <button
          type="button"
          onClick={loadSummary}
          disabled={isLoading}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-bg-muted disabled:opacity-50"
        >
          {isLoading ? "Завантаження…" : "Спробувати ще раз"}
        </button>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-[var(--space-section)] sm:px-6 md:px-8">
      <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
        Моя статистика
      </h1>
      <div className="mt-6">
        <WorkerStatistics summary={summary} />
      </div>
    </div>
  );
}

export default WorkerStatisticsPage;
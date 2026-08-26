import {
  selectStatisticsSummary,
  selectIsSummaryLoading,
  selectSummaryError,
  selectShiftsStatistics,
  selectIsShiftsStatisticsLoading,
  selectShiftsStatisticsError,
} from "../../../redux/worker-statistics/selectors";
import type { WorkerStatisticsState, StatisticsSummary, ShiftsStatistics } from "../../../redux/worker-statistics/types";
import type { RootState } from "../../../redux/store";

const summaryFixture: StatisticsSummary = {
  applications: { total: 1, pending: 0, approved: 1, rejected: 0, completed: 1, noShow: 0 },
  shifts: { completed: 1, upcoming: 0, scheduledCompletedHours: 8, estimatedCompletedEarnings: 1600 },
  companiesWorkedFor: 1,
  attendance: { completed: 1, noShow: 0, rate: 100 },
};

const shiftsStatisticsFixture: ShiftsStatistics = {
  totals: { completedShifts: 1, noShows: 0, scheduledCompletedHours: 8, estimatedCompletedEarnings: 1600 },
  series: [],
};

const workerStatisticsState: WorkerStatisticsState = {
  summary: summaryFixture,
  isSummaryLoading: true,
  summaryError: "помилка зведення",
  shiftsStatistics: shiftsStatisticsFixture,
  isShiftsStatisticsLoading: true,
  shiftsStatisticsError: "помилка динаміки",
  lastShiftsQuery: null,
};

const state = {
  workerStatistics: workerStatisticsState,
} as unknown as RootState;

describe("worker-statistics selectors", () => {
  it("selectStatisticsSummary reads the summary", () => {
    expect(selectStatisticsSummary(state)).toBe(summaryFixture);
  });

  it("selectIsSummaryLoading reads the summary loading flag", () => {
    expect(selectIsSummaryLoading(state)).toBe(true);
  });

  it("selectSummaryError reads the summary error", () => {
    expect(selectSummaryError(state)).toBe("помилка зведення");
  });

  it("selectShiftsStatistics reads the shifts statistics", () => {
    expect(selectShiftsStatistics(state)).toBe(shiftsStatisticsFixture);
  });

  it("selectIsShiftsStatisticsLoading reads the shifts loading flag", () => {
    expect(selectIsShiftsStatisticsLoading(state)).toBe(true);
  });

  it("selectShiftsStatisticsError reads the shifts error", () => {
    expect(selectShiftsStatisticsError(state)).toBe("помилка динаміки");
  });
});

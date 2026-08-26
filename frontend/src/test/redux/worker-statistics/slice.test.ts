import {
  workerStatisticsReducer,
  clearWorkerStatistics,
} from "../../../redux/worker-statistics/slice";
import { fetchStatisticsSummary, fetchShiftsStatistics } from "../../../redux/worker-statistics/actions";
import type { WorkerStatisticsState, StatisticsSummary, ShiftsStatistics } from "../../../redux/worker-statistics/types";

const initialState: WorkerStatisticsState = {
  summary: null,
  isSummaryLoading: false,
  summaryError: null,
  shiftsStatistics: null,
  isShiftsStatisticsLoading: false,
  shiftsStatisticsError: null,
  lastShiftsQuery: null,
};

const summaryFixture: StatisticsSummary = {
  applications: { total: 5, pending: 1, approved: 2, rejected: 0, completed: 2, noShow: 0 },
  shifts: { completed: 2, upcoming: 1, scheduledCompletedHours: 16, estimatedCompletedEarnings: 3200 },
  companiesWorkedFor: 2,
  attendance: { completed: 2, noShow: 0, rate: 100 },
};

const shiftsStatisticsFixture: ShiftsStatistics = {
  totals: { completedShifts: 2, noShows: 0, scheduledCompletedHours: 16, estimatedCompletedEarnings: 3200 },
  series: [
    { period: "2026-07", completedShifts: 1, noShows: 0, scheduledHours: 8, estimatedEarnings: 1600 },
    { period: "2026-08", completedShifts: 1, noShows: 0, scheduledHours: 8, estimatedEarnings: 1600 },
  ],
};

describe("workerStatisticsReducer", () => {
  it("returns the initial state by default", () => {
    expect(workerStatisticsReducer(undefined, { type: "@@INIT" })).toEqual(
      initialState,
    );
  });

  describe("fetchStatisticsSummary", () => {
    it("sets isSummaryLoading and clears the previous error when pending", () => {
      const startState: WorkerStatisticsState = {
        ...initialState,
        summaryError: "попередня помилка",
      };

      const state = workerStatisticsReducer(
        startState,
        fetchStatisticsSummary.pending("requestId", undefined),
      );

      expect(state.isSummaryLoading).toBe(true);
      expect(state.summaryError).toBeNull();
    });

    it("stores the summary and stops loading when fulfilled", () => {
      const state = workerStatisticsReducer(
        { ...initialState, isSummaryLoading: true },
        fetchStatisticsSummary.fulfilled(summaryFixture, "requestId", undefined),
      );

      expect(state.isSummaryLoading).toBe(false);
      expect(state.summary).toEqual(summaryFixture);
    });

    it("stores a readable error message and stops loading when rejected", () => {
      const state = workerStatisticsReducer(
        { ...initialState, isSummaryLoading: true },
        fetchStatisticsSummary.rejected(
          new Error("rejected"),
          "requestId",
          undefined,
          { message: "Немає доступу" },
        ),
      );

      expect(state.isSummaryLoading).toBe(false);
      expect(state.summaryError).toBe("Немає доступу");
    });

    it("falls back to a generic error message when no payload is present", () => {
      const state = workerStatisticsReducer(
        initialState,
        fetchStatisticsSummary.rejected(
          new Error("rejected"),
          "requestId",
          undefined,
        ),
      );

      expect(state.summaryError).toBe("Сталася помилка. Спробуйте ще раз.");
    });
  });

  describe("fetchShiftsStatistics", () => {
    it("records the requested query and starts loading when pending", () => {
      const query = { groupBy: "week" as const, companyId: 7 };

      const state = workerStatisticsReducer(
        initialState,
        fetchShiftsStatistics.pending("requestId", query),
      );

      expect(state.isShiftsStatisticsLoading).toBe(true);
      expect(state.shiftsStatisticsError).toBeNull();
      expect(state.lastShiftsQuery).toEqual(query);
    });

    it("stores the series and totals when fulfilled", () => {
      const state = workerStatisticsReducer(
        { ...initialState, isShiftsStatisticsLoading: true },
        fetchShiftsStatistics.fulfilled(
          shiftsStatisticsFixture,
          "requestId",
          undefined,
        ),
      );

      expect(state.isShiftsStatisticsLoading).toBe(false);
      expect(state.shiftsStatistics).toEqual(shiftsStatisticsFixture);
    });

    it("stores a readable error message and stops loading when rejected", () => {
      const state = workerStatisticsReducer(
        { ...initialState, isShiftsStatisticsLoading: true },
        fetchShiftsStatistics.rejected(
          new Error("rejected"),
          "requestId",
          undefined,
          { message: "Немає доступу" },
        ),
      );

      expect(state.isShiftsStatisticsLoading).toBe(false);
      expect(state.shiftsStatisticsError).toBe("Немає доступу");
    });
  });

  it("clearWorkerStatistics resets to the initial state", () => {
    const populatedState: WorkerStatisticsState = {
      summary: summaryFixture,
      isSummaryLoading: false,
      summaryError: "щось",
      shiftsStatistics: shiftsStatisticsFixture,
      isShiftsStatisticsLoading: false,
      shiftsStatisticsError: "щось",
      lastShiftsQuery: { groupBy: "month" },
    };

    const state = workerStatisticsReducer(
      populatedState,
      clearWorkerStatistics(),
    );

    expect(state).toEqual(initialState);
  });
});

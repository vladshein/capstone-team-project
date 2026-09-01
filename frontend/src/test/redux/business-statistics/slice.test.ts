import {
  businessStatisticsReducer,
  clearBusinessStatistics,
} from "../../../redux/business-statistics/slice";
import { fetchBusinessStatistics } from "../../../redux/business-statistics/actions";
import type {
  BusinessStatisticsState,
  BusinessStatisticsBundle,
  BusinessStatisticsQuery,
} from "../../../redux/business-statistics/types";

const initialState: BusinessStatisticsState = {
  summary: null,
  shiftsStatistics: null,
  workers: null,
  isLoading: false,
  error: null,
  lastQuery: null,
};

const bundleFixture: BusinessStatisticsBundle = {
  summary: {
    companies: { total: 2 },
    shifts: { total: 4, open: 1, booked: 1, inProgress: 0, completed: 2, cancelled: 0 },
    applications: { total: 6, pending: 1, approved: 2, rejected: 1, completed: 2, noShow: 0 },
    workers: { applied: 3, worked: 2 },
    money: { totalPaidOut: 4200 },
  },
  shifts: {
    totals: {
      completedShifts: 2,
      noShows: 0,
      scheduledCompletedHours: 16,
      estimatedSpend: 4200,
    },
    series: [
      { period: "2026-07", completedShifts: 1, noShows: 0, scheduledHours: 8, spend: 2100 },
      { period: "2026-08", completedShifts: 1, noShows: 0, scheduledHours: 8, spend: 2100 },
    ],
  },
  workers: {
    totalItems: 1,
    totalPages: 1,
    currentPage: 1,
    data: [
      {
        workerId: 11,
        firstName: "Іван",
        lastName: "Петренко",
        avatarUrl: null,
        rating: 4.8,
        totalApplications: 3,
        completedShifts: 2,
        noShow: 0,
        lastActivityAt: "2026-08-20T10:00:00.000Z",
      },
    ],
  },
};

describe("businessStatisticsReducer", () => {
  it("returns the initial state by default", () => {
    expect(businessStatisticsReducer(undefined, { type: "@@INIT" })).toEqual(
      initialState,
    );
  });

  it("records the requested query and starts loading when pending", () => {
    const query: BusinessStatisticsQuery = { companyId: 7, groupBy: "week", page: 1 };

    const state = businessStatisticsReducer(
      { ...initialState, error: "попередня помилка" },
      fetchBusinessStatistics.pending("requestId", query),
    );

    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
    expect(state.lastQuery).toEqual(query);
  });

  it("stores all three sections when fulfilled for the current query", () => {
    const query: BusinessStatisticsQuery = { companyId: 7, groupBy: "week" };

    const state = businessStatisticsReducer(
      { ...initialState, isLoading: true, lastQuery: query },
      fetchBusinessStatistics.fulfilled(bundleFixture, "requestId", query),
    );

    expect(state.isLoading).toBe(false);
    expect(state.summary).toEqual(bundleFixture.summary);
    expect(state.shiftsStatistics).toEqual(bundleFixture.shifts);
    expect(state.workers).toEqual(bundleFixture.workers);
  });

  it("ignores a stale fulfilled response whose query no longer matches lastQuery", () => {
    const staleQuery: BusinessStatisticsQuery = { companyId: 1 };
    const freshQuery: BusinessStatisticsQuery = { companyId: 2 };

    const state = businessStatisticsReducer(
      { ...initialState, isLoading: true, lastQuery: freshQuery },
      fetchBusinessStatistics.fulfilled(bundleFixture, "requestId", staleQuery),
    );

    expect(state.summary).toBeNull();
    expect(state.shiftsStatistics).toBeNull();
    expect(state.workers).toBeNull();
    expect(state.isLoading).toBe(true);
  });

  it("stores a readable error message and stops loading when rejected", () => {
    const query: BusinessStatisticsQuery = { companyId: 7 };

    const state = businessStatisticsReducer(
      { ...initialState, isLoading: true, lastQuery: query },
      fetchBusinessStatistics.rejected(new Error("rejected"), "requestId", query, {
        message: "Немає доступу до статистики цієї компанії",
      }),
    );

    expect(state.isLoading).toBe(false);
    expect(state.error).toBe("Немає доступу до статистики цієї компанії");
  });

  it("falls back to a generic error message when no payload is present", () => {
    const query: BusinessStatisticsQuery = { companyId: 7 };

    const state = businessStatisticsReducer(
      { ...initialState, isLoading: true, lastQuery: query },
      fetchBusinessStatistics.rejected(new Error("rejected"), "requestId", query),
    );

    expect(state.error).toBe("Сталася помилка. Спробуйте ще раз.");
  });

  it("ignores a stale rejected response whose query no longer matches lastQuery", () => {
    const state = businessStatisticsReducer(
      { ...initialState, isLoading: true, lastQuery: { companyId: 2 } },
      fetchBusinessStatistics.rejected(new Error("rejected"), "requestId", { companyId: 1 }, {
        message: "stale",
      }),
    );

    expect(state.error).toBeNull();
    expect(state.isLoading).toBe(true);
  });

  it("clearBusinessStatistics resets to the initial state", () => {
    const populatedState: BusinessStatisticsState = {
      summary: bundleFixture.summary,
      shiftsStatistics: bundleFixture.shifts,
      workers: bundleFixture.workers,
      isLoading: false,
      error: "щось",
      lastQuery: { companyId: 7 },
    };

    expect(
      businessStatisticsReducer(populatedState, clearBusinessStatistics()),
    ).toEqual(initialState);
  });
});

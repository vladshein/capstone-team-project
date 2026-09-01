import { configureStore } from "@reduxjs/toolkit";
import { workerStatisticsService } from "../../../services/workerStatisticsService";
import { workerStatisticsReducer } from "../../../redux/worker-statistics/slice";
import {
  fetchStatisticsSummary,
  fetchShiftsStatistics,
} from "../../../redux/worker-statistics/actions";

jest.mock("../../../services/workerStatisticsService", () => ({
  __esModule: true,
  workerStatisticsService: {
    getSummary: jest.fn(),
    getShiftsStatistics: jest.fn(),
  },
}));

const makeStore = () =>
  configureStore({ reducer: { workerStatistics: workerStatisticsReducer } });

const summaryFixture = {
  applications: { total: 1, pending: 0, approved: 1, rejected: 0, completed: 1, noShow: 0 },
  shifts: { completed: 1, upcoming: 0, scheduledCompletedHours: 8, estimatedCompletedEarnings: 1600 },
  companiesWorkedFor: 1,
  attendance: { completed: 1, noShow: 0, rate: 100 },
};

describe("worker-statistics thunks", () => {
  beforeEach(() => {
    jest.mocked(workerStatisticsService.getSummary).mockReset();
    jest.mocked(workerStatisticsService.getShiftsStatistics).mockReset();
  });

  it("fetchStatisticsSummary unwraps response.data.data into the store", async () => {
    jest
      .mocked(workerStatisticsService.getSummary)
      .mockResolvedValueOnce({ data: { data: summaryFixture } } as never);

    const store = makeStore();
    await store.dispatch(fetchStatisticsSummary({}));

    expect(workerStatisticsService.getSummary).toHaveBeenCalledWith({});
    expect(store.getState().workerStatistics.summary).toEqual(summaryFixture);
  });

  it("fetchStatisticsSummary maps an axios-shaped error through toApiError", async () => {
    jest.mocked(workerStatisticsService.getSummary).mockRejectedValueOnce({
      response: { status: 403, data: { message: "Немає доступу" } },
    });

    const store = makeStore();
    const result = await store.dispatch(fetchStatisticsSummary(undefined));

    expect(result.type).toBe("worker-statistics/fetchSummary/rejected");
    expect((result.payload as { status?: number }).status).toBe(403);
    expect(store.getState().workerStatistics.summaryError).toBe("Немає доступу");
  });

  it("fetchShiftsStatistics stores the series and falls back to a generic message on a plain Error", async () => {
    jest
      .mocked(workerStatisticsService.getShiftsStatistics)
      .mockResolvedValueOnce({
        data: { data: { totals: {}, series: [] } },
      } as never);

    const store = makeStore();
    await store.dispatch(fetchShiftsStatistics({ groupBy: "week" }));

    expect(workerStatisticsService.getShiftsStatistics).toHaveBeenCalledWith({
      groupBy: "week",
    });
    expect(store.getState().workerStatistics.shiftsStatistics).toEqual({
      totals: {},
      series: [],
    });

    jest
      .mocked(workerStatisticsService.getShiftsStatistics)
      .mockRejectedValueOnce(new Error("Network down"));
    const rejected = await store.dispatch(fetchShiftsStatistics(undefined));
    expect((rejected.payload as { message?: string }).message).toBe("Network down");
  });
});

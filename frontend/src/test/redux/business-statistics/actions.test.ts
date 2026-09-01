import { configureStore } from "@reduxjs/toolkit";
import { businessStatisticsService } from "../../../services/businessStatisticsService";
import { businessStatisticsReducer } from "../../../redux/business-statistics/slice";
import { fetchBusinessStatistics } from "../../../redux/business-statistics/actions";

jest.mock("../../../services/businessStatisticsService", () => ({
  __esModule: true,
  businessStatisticsService: { getStatistics: jest.fn() },
}));

const makeStore = () =>
  configureStore({ reducer: { businessStatistics: businessStatisticsReducer } });

const bundleFixture = {
  summary: {
    companies: { total: 1 },
    shifts: { total: 1, open: 0, booked: 0, inProgress: 0, completed: 1, cancelled: 0 },
    applications: { total: 1, pending: 0, approved: 1, rejected: 0, completed: 1, noShow: 0 },
    workers: { applied: 1, worked: 1 },
    money: { totalPaidOut: 1600 },
  },
  shifts: { totals: { completedShifts: 1, noShows: 0, scheduledCompletedHours: 8, estimatedSpend: 1600 }, series: [] },
  workers: { totalItems: 0, totalPages: 0, currentPage: 1, data: [] },
};

describe("business-statistics thunk", () => {
  beforeEach(() => {
    jest.mocked(businessStatisticsService.getStatistics).mockReset();
  });

  it("unwraps response.data.data into all three store sections", async () => {
    jest
      .mocked(businessStatisticsService.getStatistics)
      .mockResolvedValueOnce({ data: { data: bundleFixture } } as never);

    const store = makeStore();
    await store.dispatch(fetchBusinessStatistics({ companyId: 7 }));

    expect(businessStatisticsService.getStatistics).toHaveBeenCalledWith({ companyId: 7 });
    const state = store.getState().businessStatistics;
    expect(state.summary).toEqual(bundleFixture.summary);
    expect(state.shiftsStatistics).toEqual(bundleFixture.shifts);
    expect(state.workers).toEqual(bundleFixture.workers);
  });

  it("maps an axios-shaped error through toApiError", async () => {
    jest.mocked(businessStatisticsService.getStatistics).mockRejectedValueOnce({
      response: { status: 403, data: { message: "Чужа компанія" } },
    });

    const store = makeStore();
    const result = await store.dispatch(fetchBusinessStatistics(undefined));

    expect(result.type).toBe("business-statistics/fetchStatistics/rejected");
    expect((result.payload as { status?: number }).status).toBe(403);
    expect(store.getState().businessStatistics.error).toBe("Чужа компанія");
  });
});

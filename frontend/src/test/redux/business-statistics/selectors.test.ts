import {
  selectBusinessStatisticsSummary,
  selectBusinessShiftsStatistics,
  selectBusinessWorkersStatistics,
  selectIsBusinessStatisticsLoading,
  selectBusinessStatisticsError,
} from "../../../redux/business-statistics/selectors";
import type { BusinessStatisticsState } from "../../../redux/business-statistics/types";
import type { RootState } from "../../../redux/store";

const summaryFixture = {
  companies: { total: 1 },
  shifts: { total: 1, open: 0, booked: 0, inProgress: 0, completed: 1, cancelled: 0 },
  applications: { total: 1, pending: 0, approved: 1, rejected: 0, completed: 1, noShow: 0 },
  workers: { applied: 1, worked: 1 },
  money: { totalPaidOut: 1600 },
};

const shiftsFixture = {
  totals: { completedShifts: 1, noShows: 0, scheduledCompletedHours: 8, estimatedSpend: 1600 },
  series: [],
};

const workersFixture = { totalItems: 0, totalPages: 0, currentPage: 1, data: [] };

const businessStatisticsState: BusinessStatisticsState = {
  summary: summaryFixture,
  shiftsStatistics: shiftsFixture,
  workers: workersFixture,
  isLoading: true,
  error: "помилка бізнес-статистики",
  lastQuery: null,
};

const state = {
  businessStatistics: businessStatisticsState,
} as unknown as RootState;

describe("business-statistics selectors", () => {
  it("selectBusinessStatisticsSummary reads the summary", () => {
    expect(selectBusinessStatisticsSummary(state)).toBe(summaryFixture);
  });

  it("selectBusinessShiftsStatistics reads the shifts statistics", () => {
    expect(selectBusinessShiftsStatistics(state)).toBe(shiftsFixture);
  });

  it("selectBusinessWorkersStatistics reads the workers statistics", () => {
    expect(selectBusinessWorkersStatistics(state)).toBe(workersFixture);
  });

  it("selectIsBusinessStatisticsLoading reads the loading flag", () => {
    expect(selectIsBusinessStatisticsLoading(state)).toBe(true);
  });

  it("selectBusinessStatisticsError reads the error", () => {
    expect(selectBusinessStatisticsError(state)).toBe("помилка бізнес-статистики");
  });
});

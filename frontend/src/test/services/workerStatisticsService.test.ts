import api from "../../api/client";
import { workerStatisticsService } from "../../services/workerStatisticsService";

jest.mock("../../api/client", () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

describe("workerStatisticsService", () => {
  beforeEach(() => {
    jest.mocked(api.get).mockReset();
  });

  it("getSummary calls the summary endpoint with the given query params", async () => {
    const responseData = { data: { applications: { total: 1 } } };
    jest.mocked(api.get).mockResolvedValueOnce({ data: responseData });

    const params = { dateFrom: "2026-01-01", dateTo: "2026-08-01", companyId: 3 };
    const result = await workerStatisticsService.getSummary(params);

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith(
      "/worker-profiles/me/statistics/summary",
      { params },
    );
    expect(result.data).toEqual(responseData);
  });

  it("getShiftsStatistics calls the shifts endpoint with the given query params", async () => {
    const responseData = { data: { totals: {}, series: [] } };
    jest.mocked(api.get).mockResolvedValueOnce({ data: responseData });

    const params = { groupBy: "week" as const, city: "Київ" };
    const result = await workerStatisticsService.getShiftsStatistics(params);

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith(
      "/worker-profiles/me/statistics/shifts",
      { params },
    );
    expect(result.data).toEqual(responseData);
  });

  it("propagates rejection from the underlying HTTP client", async () => {
    const error = new Error("Network error");
    jest.mocked(api.get).mockRejectedValueOnce(error);

    await expect(workerStatisticsService.getSummary({})).rejects.toThrow(
      "Network error",
    );
  });
});

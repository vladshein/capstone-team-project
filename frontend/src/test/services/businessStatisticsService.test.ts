import api from "../../api/client";
import { businessStatisticsService } from "../../services/businessStatisticsService";

jest.mock("../../api/client", () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

describe("businessStatisticsService", () => {
  beforeEach(() => {
    jest.mocked(api.get).mockReset();
  });

  it("getStatistics calls the combined endpoint with the given query params", async () => {
    const responseData = { data: { summary: {}, shifts: {}, workers: {} } };
    jest.mocked(api.get).mockResolvedValueOnce({ data: responseData });

    const params = { companyId: 7, groupBy: "month" as const, page: 2, limit: 10 };
    const result = await businessStatisticsService.getStatistics(params);

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith("/companies/me/statistics", { params });
    expect(result.data).toEqual(responseData);
  });

  it("propagates rejection from the underlying HTTP client", async () => {
    jest.mocked(api.get).mockRejectedValueOnce(new Error("Network error"));

    await expect(
      businessStatisticsService.getStatistics({}),
    ).rejects.toThrow("Network error");
  });
});

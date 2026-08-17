import { jest } from "@jest/globals";

const getWorkerStatisticsSummary = jest.fn();

jest.unstable_mockModule("../services/workerProfileServices.js", () => ({}));

jest.unstable_mockModule("../services/worker-statistics.service.js", () => ({
  getWorkerStatisticsSummary,
}));

const { getStatisticsSummary } =
  await import("../controllers/workerProfileControllers.js");

const createResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("getStatisticsSummary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns statistics for the authenticated worker with valid query parameters", async () => {
    const statistics = { applications: { total: 3 } };
    const req = {
      user: { id: 42, role: "worker" },
      query: {
        dateFrom: "2026-08-01T00:00:00.000Z",
        dateTo: "2026-08-31T23:59:59.999Z",
        companyId: "7",
      },
    };
    const res = createResponse();
    const next = jest.fn();
    getWorkerStatisticsSummary.mockResolvedValue(statistics);

    await getStatisticsSummary(req, res, next);

    expect(getWorkerStatisticsSummary).toHaveBeenCalledWith(42, {
      dateFrom: "2026-08-01T00:00:00.000Z",
      dateTo: "2026-08-31T23:59:59.999Z",
      companyId: 7,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: statistics });
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 400 for an invalid dateFrom", async () => {
    const res = createResponse();

    await getStatisticsSummary(
      { user: { id: 42 }, query: { dateFrom: "not-a-date" } },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "dateFrom must be a valid ISO date.",
    });
    expect(getWorkerStatisticsSummary).not.toHaveBeenCalled();
  });

  test("returns 400 for a non-integer companyId", async () => {
    const res = createResponse();

    await getStatisticsSummary(
      { user: { id: 42 }, query: { companyId: "7.5" } },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "companyId must be an integer.",
    });
    expect(getWorkerStatisticsSummary).not.toHaveBeenCalled();
  });

  test("returns statistics without optional query parameters", async () => {
    const statistics = { applications: { total: 0 } };
    const res = createResponse();
    const next = jest.fn();
    getWorkerStatisticsSummary.mockResolvedValue(statistics);

    await getStatisticsSummary({ user: { id: 42 }, query: {} }, res, next);

    expect(getWorkerStatisticsSummary).toHaveBeenCalledWith(42, {
      dateFrom: undefined,
      dateTo: undefined,
      companyId: undefined,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: statistics });
    expect(next).not.toHaveBeenCalled();
  });
});

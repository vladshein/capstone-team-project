import { jest } from "@jest/globals";

const getWorkerStatisticsSummary = jest.fn();
const getWorkerShiftsStatistics = jest.fn();

// Mirrors services/workerStatistics.service.resolveDateRange so the
// controller's range validation runs with real dates in these tests.
const resolveDateRange = jest.fn((dateFrom, dateTo) => {
  let from = dateFrom ? new Date(dateFrom) : null;
  let to = dateTo ? new Date(dateTo) : null;

  if (!from && !to) {
    to = new Date();
    from = new Date(to);
    from.setMonth(from.getMonth() - 3);
  } else if (from && !to) {
    to = new Date();
  } else if (!from && to) {
    from = new Date(to);
    from.setMonth(from.getMonth() - 3);
  }

  return { dateFrom: from, dateTo: to };
});

jest.unstable_mockModule("../services/workerProfileServices.js", () => ({}));

jest.unstable_mockModule("../services/workerStatistics.service.js", () => ({
  getWorkerStatisticsSummary,
  getWorkerShiftsStatistics,
  resolveDateRange,
}));

const { getStatisticsSummary, getShiftsStatistics } =
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

describe("getShiftsStatistics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns shifts statistics for a valid request", async () => {
    const statistics = { totals: { completedShifts: 5 }, series: [] };
    const req = {
      user: { id: 42, role: "worker" },
      query: {
        dateFrom: "2026-07-01T00:00:00.000Z",
        dateTo: "2026-09-30T23:59:59.999Z",
        groupBy: "month",
        companyId: "7",
      },
    };
    const res = createResponse();
    const next = jest.fn();
    getWorkerShiftsStatistics.mockResolvedValue(statistics);

    await getShiftsStatistics(req, res, next);

    expect(getWorkerShiftsStatistics).toHaveBeenCalledWith(42, {
      dateFrom: "2026-07-01T00:00:00.000Z",
      dateTo: "2026-09-30T23:59:59.999Z",
      groupBy: "month",
      companyId: 7,
      city: undefined,
      positionId: undefined,
      categoryId: undefined,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: statistics });
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 400 when the date range exceeds 12 months", async () => {
    const res = createResponse();

    await getShiftsStatistics(
      {
        user: { id: 42 },
        query: {
          dateFrom: "2024-01-01T00:00:00.000Z",
          dateTo: "2026-02-01T00:00:00.000Z",
          groupBy: "month",
        },
      },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Date range must not exceed 12 months.",
    });
    expect(getWorkerShiftsStatistics).not.toHaveBeenCalled();
  });

  test("returns 400 when groupBy is invalid", async () => {
    const res = createResponse();

    await getShiftsStatistics(
      { user: { id: 42 }, query: { groupBy: "year" } },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(getWorkerShiftsStatistics).not.toHaveBeenCalled();
  });

  test("returns 400 when only dateFrom is provided and it is more than 12 months in the past", async () => {
    const res = createResponse();
    const twelveMonthsAgo = new Date(
      Date.now() - 13 * 30 * 24 * 60 * 60 * 1000,
    );

    await getShiftsStatistics(
      {
        user: { id: 42 },
        query: { dateFrom: twelveMonthsAgo.toISOString() },
      },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Date range must not exceed 12 months.",
    });
    expect(getWorkerShiftsStatistics).not.toHaveBeenCalled();
  });

  test("returns 400 when dateFrom is later than dateTo", async () => {
    const res = createResponse();

    await getShiftsStatistics(
      {
        user: { id: 42 },
        query: {
          dateFrom: "2026-09-30T23:59:59.999Z",
          dateTo: "2026-07-01T00:00:00.000Z",
          groupBy: "month",
        },
      },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "dateFrom must be earlier than dateTo.",
    });
    expect(getWorkerShiftsStatistics).not.toHaveBeenCalled();
  });

  test("returns 400 when positionId is not an integer", async () => {
    const res = createResponse();

    await getShiftsStatistics(
      { user: { id: 42 }, query: { positionId: "abc" } },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "positionId must be an integer.",
    });
    expect(getWorkerShiftsStatistics).not.toHaveBeenCalled();
  });
});

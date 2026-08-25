import { jest } from "@jest/globals";

const getBusinessStatisticsSummary = jest.fn();
const getBusinessShiftsStatistics = jest.fn();
const getBusinessWorkersStatistics = jest.fn();

// Mirrors services/statisticsHelpers.resolveDateRange so the controller's
// range validation runs with real dates in these tests.
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

jest.unstable_mockModule("../services/businessStatistics.service.js", () => ({
  getBusinessStatisticsSummary,
  getBusinessShiftsStatistics,
  getBusinessWorkersStatistics,
  resolveDateRange,
}));

const { getStatisticsSummary, getShiftsStatistics, getWorkersStatistics } =
  await import("../controllers/businessStatisticsControllers.js");

const createResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res;
};

describe("getStatisticsSummary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns statistics for the authenticated owner with a companyId filter", async () => {
    const statistics = { shifts: { total: 3 } };
    const res = createResponse();
    const next = jest.fn();
    getBusinessStatisticsSummary.mockResolvedValue(statistics);

    await getStatisticsSummary(
      { user: { id: 9 }, query: { companyId: "7" } },
      res,
      next,
    );

    expect(getBusinessStatisticsSummary).toHaveBeenCalledWith(9, { companyId: 7 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: statistics });
    expect(next).not.toHaveBeenCalled();
  });

  test("returns statistics for all companies when companyId is omitted", async () => {
    const statistics = { shifts: { total: 9 } };
    const res = createResponse();
    getBusinessStatisticsSummary.mockResolvedValue(statistics);

    await getStatisticsSummary({ user: { id: 9 }, query: {} }, res, jest.fn());

    expect(getBusinessStatisticsSummary).toHaveBeenCalledWith(9, { companyId: undefined });
  });

  test("returns 400 for a non-integer companyId", async () => {
    const res = createResponse();

    await getStatisticsSummary(
      { user: { id: 9 }, query: { companyId: "abc" } },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "companyId must be an integer." });
    expect(getBusinessStatisticsSummary).not.toHaveBeenCalled();
  });

  test("forwards service errors (e.g. 403 for an unowned company) via next", async () => {
    const res = createResponse();
    const next = jest.fn();
    const error = Object.assign(new Error("forbidden"), { status: 403 });
    getBusinessStatisticsSummary.mockRejectedValue(error);

    await getStatisticsSummary({ user: { id: 9 }, query: {} }, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("getShiftsStatistics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns shifts statistics for a valid request", async () => {
    const statistics = { totals: { completedShifts: 5 }, series: [] };
    const req = {
      user: { id: 9 },
      query: {
        dateFrom: "2026-07-01T00:00:00.000Z",
        dateTo: "2026-09-30T23:59:59.999Z",
        groupBy: "month",
        companyId: "7",
      },
    };
    const res = createResponse();
    const next = jest.fn();
    getBusinessShiftsStatistics.mockResolvedValue(statistics);

    await getShiftsStatistics(req, res, next);

    expect(getBusinessShiftsStatistics).toHaveBeenCalledWith(9, {
      dateFrom: "2026-07-01T00:00:00.000Z",
      dateTo: "2026-09-30T23:59:59.999Z",
      groupBy: "month",
      companyId: 7,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: statistics });
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 400 when the date range exceeds 12 months", async () => {
    const res = createResponse();

    await getShiftsStatistics(
      {
        user: { id: 9 },
        query: {
          dateFrom: "2024-01-01T00:00:00.000Z",
          dateTo: "2026-02-01T00:00:00.000Z",
        },
      },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Date range must not exceed 12 months." });
    expect(getBusinessShiftsStatistics).not.toHaveBeenCalled();
  });

  test("returns 400 when groupBy is invalid", async () => {
    const res = createResponse();

    await getShiftsStatistics({ user: { id: 9 }, query: { groupBy: "year" } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(getBusinessShiftsStatistics).not.toHaveBeenCalled();
  });

  test("returns 400 when dateFrom is later than dateTo", async () => {
    const res = createResponse();

    await getShiftsStatistics(
      {
        user: { id: 9 },
        query: {
          dateFrom: "2026-09-30T23:59:59.999Z",
          dateTo: "2026-07-01T00:00:00.000Z",
        },
      },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "dateFrom must be earlier than dateTo." });
    expect(getBusinessShiftsStatistics).not.toHaveBeenCalled();
  });
});

describe("getWorkersStatistics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns a paginated workers list and sets Cache-Control: no-store", async () => {
    const statistics = { totalItems: 1, totalPages: 1, currentPage: 1, data: [] };
    const res = createResponse();
    const next = jest.fn();
    getBusinessWorkersStatistics.mockResolvedValue(statistics);

    await getWorkersStatistics(
      { user: { id: 9 }, query: { companyId: "3", page: "2", limit: "5" } },
      res,
      next,
    );

    expect(getBusinessWorkersStatistics).toHaveBeenCalledWith(9, {
      companyId: 3,
      page: 2,
      limit: 5,
    });
    expect(res.set).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: statistics });
    expect(next).not.toHaveBeenCalled();
  });

  test("clamps limit to 50 and defaults page to 1", async () => {
    getBusinessWorkersStatistics.mockResolvedValue({});
    const res = createResponse();

    await getWorkersStatistics(
      { user: { id: 9 }, query: { limit: "500" } },
      res,
      jest.fn(),
    );

    expect(getBusinessWorkersStatistics).toHaveBeenCalledWith(9, {
      companyId: undefined,
      page: 1,
      limit: 50,
    });
  });

  test("returns 400 for a non-integer companyId", async () => {
    const res = createResponse();

    await getWorkersStatistics(
      { user: { id: 9 }, query: { companyId: "abc" } },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "companyId must be an integer." });
    expect(getBusinessWorkersStatistics).not.toHaveBeenCalled();
  });
});

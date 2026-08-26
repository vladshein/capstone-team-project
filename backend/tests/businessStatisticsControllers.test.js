import { jest } from "@jest/globals";

const getBusinessStatisticsBundle = jest.fn();

// Mirrors helpers/statisticsHelpers.resolveDateRange so the controller's
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

jest.unstable_mockModule("../services/businessStatisticsServices.js", () => ({
  getBusinessStatisticsBundle,
  resolveDateRange,
}));

const { getStatistics } = await import("../controllers/businessStatisticsControllers.js");

const createResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res;
};

describe("getStatistics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns the combined summary/shifts/workers bundle and sets Cache-Control: no-store", async () => {
    const statistics = {
      summary: { shifts: { total: 3 } },
      shifts: { totals: { completedShifts: 5 }, series: [] },
      workers: { totalItems: 1, totalPages: 1, currentPage: 2, data: [] },
    };
    const res = createResponse();
    const next = jest.fn();
    getBusinessStatisticsBundle.mockResolvedValue(statistics);

    await getStatistics(
      {
        user: { id: 9 },
        query: {
          companyId: "7",
          dateFrom: "2026-07-01T00:00:00.000Z",
          dateTo: "2026-09-30T23:59:59.999Z",
          groupBy: "month",
          page: "2",
          limit: "5",
        },
      },
      res,
      next,
    );

    expect(getBusinessStatisticsBundle).toHaveBeenCalledWith(9, {
      dateFrom: "2026-07-01T00:00:00.000Z",
      dateTo: "2026-09-30T23:59:59.999Z",
      groupBy: "month",
      companyId: 7,
      page: 2,
      limit: 5,
    });
    expect(res.set).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: statistics });
    expect(next).not.toHaveBeenCalled();
  });

  test("defaults companyId, page and limit, and clamps an oversized limit to 50", async () => {
    getBusinessStatisticsBundle.mockResolvedValue({});
    const res = createResponse();

    await getStatistics({ user: { id: 9 }, query: { limit: "500" } }, res, jest.fn());

    expect(getBusinessStatisticsBundle).toHaveBeenCalledWith(9, {
      dateFrom: undefined,
      dateTo: undefined,
      groupBy: undefined,
      companyId: undefined,
      page: 1,
      limit: 50,
    });
  });

  test("returns 400 for a non-integer companyId", async () => {
    const res = createResponse();

    await getStatistics(
      { user: { id: 9 }, query: { companyId: "abc" } },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "companyId must be an integer." });
    expect(getBusinessStatisticsBundle).not.toHaveBeenCalled();
  });

  test("returns 400 when groupBy is invalid", async () => {
    const res = createResponse();

    await getStatistics({ user: { id: 9 }, query: { groupBy: "year" } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "groupBy must be 'week' or 'month'." });
    expect(getBusinessStatisticsBundle).not.toHaveBeenCalled();
  });

  test("returns 400 when dateFrom is later than dateTo", async () => {
    const res = createResponse();

    await getStatistics(
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
    expect(getBusinessStatisticsBundle).not.toHaveBeenCalled();
  });

  test("returns 400 when the date range exceeds 12 months", async () => {
    const res = createResponse();

    await getStatistics(
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
    expect(getBusinessStatisticsBundle).not.toHaveBeenCalled();
  });

  test("forwards service errors (e.g. 403 for an unowned company) via next", async () => {
    const res = createResponse();
    const next = jest.fn();
    const error = Object.assign(new Error("forbidden"), { status: 403 });
    getBusinessStatisticsBundle.mockRejectedValue(error);

    await getStatistics({ user: { id: 9 }, query: {} }, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

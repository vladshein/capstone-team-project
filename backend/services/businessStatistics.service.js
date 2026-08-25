import { Op, col, fn, literal } from "sequelize";
import {
  Company,
  Location,
  Shift,
  ShiftApplication,
  User,
  Wallet,
  WorkerProfile,
} from "../db/models/index.js";
import {
  numberOrZero,
  buildShiftRangeFilter,
  resolveDateRange,
} from "./statisticsHelpers.js";

export { resolveDateRange };

const getOwnedCompanyIds = async (ownerId) => {
  const companies = await Company.findAll({
    where: { ownerId },
    attributes: ["id"],
    raw: true,
  });

  return companies.map((company) => company.id);
};

/**
 * Narrows the owner's companies down to a single one when `companyId` is
 * given, otherwise keeps every company the owner has. Throws 403 when
 * `companyId` does not belong to `ownedCompanyIds`, so a business_client
 * cannot read another owner's statistics by id-guessing.
 */
const resolveCompanyScope = (companyId, ownedCompanyIds) => {
  if (companyId === undefined) return ownedCompanyIds;

  if (!ownedCompanyIds.includes(companyId)) {
    const error = new Error("У вас немає доступу до цієї компанії");
    error.status = 403;
    throw error;
  }

  return [companyId];
};

const zeroSummary = (companiesTotal, wallet) => ({
  companies: { total: companiesTotal },
  shifts: { total: 0, open: 0, booked: 0, inProgress: 0, completed: 0, cancelled: 0 },
  applications: { total: 0, pending: 0, approved: 0, rejected: 0, completed: 0, noShow: 0 },
  workers: { applied: 0, worked: 0 },
  money: {
    totalPaidOut: 0,
    wallet: wallet
      ? { balance: numberOrZero(wallet.balance), frozenBalance: numberOrZero(wallet.frozenBalance) }
      : null,
  },
});

/**
 * Returns an owner's aggregate shifts/applications/workers/money summary,
 * scoped to one company (`companyId`) or to every company they own.
 *
 * `companies.total` always reflects the owner's full company count, even
 * when `companyId` narrows the rest of the response to one of them — it is
 * informational, mirroring how the worker summary always returns a wallet
 * snapshot regardless of its own filters.
 */
export async function getBusinessStatisticsSummary(ownerId, { companyId } = {}) {
  const ownedCompanyIds = await getOwnedCompanyIds(ownerId);
  const scopeCompanyIds = resolveCompanyScope(companyId, ownedCompanyIds);

  const wallet = await Wallet.findOne({
    where: { userId: ownerId },
    attributes: ["balance", "frozenBalance"],
    raw: true,
  });

  if (scopeCompanyIds.length === 0) {
    return zeroSummary(ownedCompanyIds.length, wallet);
  }

  const locationWhere = { companyId: { [Op.in]: scopeCompanyIds } };
  const shiftInclude = {
    model: Shift,
    attributes: [],
    required: true,
    include: [
      {
        model: Location,
        attributes: [],
        required: true,
        where: locationWhere,
      },
    ],
  };

  const scheduledHours =
    'EXTRACT(EPOCH FROM ("Shift"."endTime" - "Shift"."startTime")) / 3600.0';
  const estimatedEarnings = `(${scheduledHours} * "Shift"."hourlyRate" + COALESCE("Shift"."bonusRate", 0))`;
  const completed = '"ShiftApplication"."status" = \'completed\'';

  const [shiftAggregate, applicationAggregate] = await Promise.all([
    Shift.findOne({
      attributes: [
        [fn("COUNT", col("Shift.id")), "total"],
        [
          literal(`COALESCE(SUM(CASE WHEN "Shift"."status" = 'open' THEN 1 ELSE 0 END), 0)`),
          "open",
        ],
        [
          literal(`COALESCE(SUM(CASE WHEN "Shift"."status" = 'booked' THEN 1 ELSE 0 END), 0)`),
          "booked",
        ],
        [
          literal(`COALESCE(SUM(CASE WHEN "Shift"."status" = 'in_progress' THEN 1 ELSE 0 END), 0)`),
          "inProgress",
        ],
        [
          literal(`COALESCE(SUM(CASE WHEN "Shift"."status" = 'completed' THEN 1 ELSE 0 END), 0)`),
          "completed",
        ],
        [
          literal(`COALESCE(SUM(CASE WHEN "Shift"."status" = 'cancelled' THEN 1 ELSE 0 END), 0)`),
          "cancelled",
        ],
      ],
      include: [{ model: Location, attributes: [], required: true, where: locationWhere }],
      raw: true,
    }),
    ShiftApplication.findOne({
      attributes: [
        [fn("COUNT", col("ShiftApplication.id")), "total"],
        [
          literal(
            `COALESCE(SUM(CASE WHEN "ShiftApplication"."status" = 'pending' THEN 1 ELSE 0 END), 0)`,
          ),
          "pending",
        ],
        [
          literal(
            `COALESCE(SUM(CASE WHEN "ShiftApplication"."status" = 'approved' THEN 1 ELSE 0 END), 0)`,
          ),
          "approved",
        ],
        [
          literal(
            `COALESCE(SUM(CASE WHEN "ShiftApplication"."status" = 'rejected' THEN 1 ELSE 0 END), 0)`,
          ),
          "rejected",
        ],
        [
          literal(`COALESCE(SUM(CASE WHEN ${completed} THEN 1 ELSE 0 END), 0)`),
          "completed",
        ],
        [
          literal(
            `COALESCE(SUM(CASE WHEN "ShiftApplication"."status" = 'no_show' THEN 1 ELSE 0 END), 0)`,
          ),
          "noShow",
        ],
        [
          literal(
            `COALESCE(SUM(CASE WHEN ${completed} THEN ${estimatedEarnings} ELSE 0 END), 0)`,
          ),
          "totalPaidOut",
        ],
        [
          literal(`COUNT(DISTINCT "ShiftApplication"."workerId")`),
          "workersApplied",
        ],
        [
          literal(
            `COUNT(DISTINCT CASE WHEN ${completed} THEN "ShiftApplication"."workerId" END)`,
          ),
          "workersWorked",
        ],
      ],
      include: [shiftInclude],
      raw: true,
    }),
  ]);

  const shiftValues = shiftAggregate ?? {};
  const applicationValues = applicationAggregate ?? {};

  return {
    companies: { total: ownedCompanyIds.length },
    shifts: {
      total: numberOrZero(shiftValues.total),
      open: numberOrZero(shiftValues.open),
      booked: numberOrZero(shiftValues.booked),
      inProgress: numberOrZero(shiftValues.inProgress),
      completed: numberOrZero(shiftValues.completed),
      cancelled: numberOrZero(shiftValues.cancelled),
    },
    applications: {
      total: numberOrZero(applicationValues.total),
      pending: numberOrZero(applicationValues.pending),
      approved: numberOrZero(applicationValues.approved),
      rejected: numberOrZero(applicationValues.rejected),
      completed: numberOrZero(applicationValues.completed),
      noShow: numberOrZero(applicationValues.noShow),
    },
    workers: {
      applied: numberOrZero(applicationValues.workersApplied),
      worked: numberOrZero(applicationValues.workersWorked),
    },
    money: {
      totalPaidOut: numberOrZero(applicationValues.totalPaidOut),
      wallet: wallet
        ? { balance: numberOrZero(wallet.balance), frozenBalance: numberOrZero(wallet.frozenBalance) }
        : null,
    },
  };
}

/**
 * Returns an owner's time-series shifts statistics grouped by period.
 *
 * Mirrors `getWorkerShiftsStatistics`: the group period is derived from
 * Shift.endTime in UTC, only applications whose attendance is resolved
 * ("completed" or "no_show") are considered, and hours/spend are summed only
 * for "completed" applications.
 */
export async function getBusinessShiftsStatistics(
  ownerId,
  { dateFrom, dateTo, groupBy = "month", companyId } = {},
) {
  const ownedCompanyIds = await getOwnedCompanyIds(ownerId);
  const scopeCompanyIds = resolveCompanyScope(companyId, ownedCompanyIds);

  const { dateFrom: resolvedFrom, dateTo: resolvedTo } = resolveDateRange(
    dateFrom,
    dateTo,
  );

  if (scopeCompanyIds.length === 0) {
    return {
      totals: {
        completedShifts: 0,
        noShows: 0,
        scheduledCompletedHours: 0,
        estimatedSpend: 0,
      },
      series: [],
    };
  }

  const shiftWhere = buildShiftRangeFilter({
    dateFrom: resolvedFrom,
    dateTo: resolvedTo,
  });

  const shiftInclude = {
    model: Shift,
    attributes: [],
    required: true,
    where: shiftWhere,
    include: [
      {
        model: Location,
        attributes: [],
        required: true,
        where: { companyId: { [Op.in]: scopeCompanyIds } },
      },
    ],
  };

  const scheduledHours =
    'EXTRACT(EPOCH FROM ("Shift"."endTime" - "Shift"."startTime")) / 3600.0';
  const estimatedEarnings = `(${scheduledHours} * "Shift"."hourlyRate" + COALESCE("Shift"."bonusRate", 0))`;

  const periodExpression =
    groupBy === "week"
      ? `to_char("Shift"."endTime" AT TIME ZONE 'UTC', 'IYYY-"W"IW')`
      : `to_char("Shift"."endTime" AT TIME ZONE 'UTC', 'YYYY-MM')`;

  const rows = await ShiftApplication.findAll({
    where: {
      status: { [Op.in]: ["completed", "no_show"] },
    },
    attributes: [
      [literal(periodExpression), "period"],
      [
        literal(
          `COALESCE(SUM(CASE WHEN "ShiftApplication"."status" = 'completed' THEN 1 ELSE 0 END), 0)`,
        ),
        "completedShifts",
      ],
      [
        literal(
          `COALESCE(SUM(CASE WHEN "ShiftApplication"."status" = 'no_show' THEN 1 ELSE 0 END), 0)`,
        ),
        "noShows",
      ],
      [
        literal(
          `COALESCE(SUM(CASE WHEN "ShiftApplication"."status" = 'completed' THEN ${scheduledHours} ELSE 0 END), 0)`,
        ),
        "scheduledHours",
      ],
      [
        literal(
          `COALESCE(SUM(CASE WHEN "ShiftApplication"."status" = 'completed' THEN ${estimatedEarnings} ELSE 0 END), 0)`,
        ),
        "spend",
      ],
    ],
    include: [shiftInclude],
    group: [literal(periodExpression)],
    order: [["period", "ASC"]],
    raw: true,
  });

  const series = (rows ?? []).map((row) => ({
    period: row.period,
    completedShifts: numberOrZero(row.completedShifts),
    noShows: numberOrZero(row.noShows),
    scheduledHours: numberOrZero(row.scheduledHours),
    spend: numberOrZero(row.spend),
  }));

  const totals = series.reduce(
    (acc, p) => {
      acc.completedShifts += p.completedShifts;
      acc.noShows += p.noShows;
      acc.scheduledCompletedHours += p.scheduledHours;
      acc.estimatedSpend += p.spend;
      return acc;
    },
    {
      completedShifts: 0,
      noShows: 0,
      scheduledCompletedHours: 0,
      estimatedSpend: 0,
    },
  );

  return { totals, series };
}

/**
 * Returns a paginated list of distinct workers who applied to / worked for
 * the scoped company(ies), most recently active first.
 *
 * Runs as three queries instead of one grouped+joined query: aggregating
 * ShiftApplication by workerId (Shift/Location included with `attributes: []`
 * purely to filter by company, so they don't need to appear in GROUP BY),
 * then fetching display info (name/avatar/rating) only for the workerIds on
 * the current page, then a separate COUNT(DISTINCT workerId) for pagination.
 * This avoids the GROUP BY pitfalls of selecting joined-table columns in a
 * grouped raw query.
 */
export async function getBusinessWorkersStatistics(
  ownerId,
  { companyId, page = 1, limit = 10 } = {},
) {
  const ownedCompanyIds = await getOwnedCompanyIds(ownerId);
  const scopeCompanyIds = resolveCompanyScope(companyId, ownedCompanyIds);

  if (scopeCompanyIds.length === 0) {
    return { totalItems: 0, totalPages: 0, currentPage: page, data: [] };
  }

  const shiftInclude = {
    model: Shift,
    attributes: [],
    required: true,
    include: [
      {
        model: Location,
        attributes: [],
        required: true,
        where: { companyId: { [Op.in]: scopeCompanyIds } },
      },
    ],
  };

  const [countRow, rows] = await Promise.all([
    ShiftApplication.findOne({
      attributes: [
        [literal(`COUNT(DISTINCT "ShiftApplication"."workerId")`), "total"],
      ],
      include: [shiftInclude],
      raw: true,
    }),
    ShiftApplication.findAll({
      attributes: [
        "workerId",
        [fn("COUNT", col("ShiftApplication.id")), "totalApplications"],
        [
          literal(
            `COALESCE(SUM(CASE WHEN "ShiftApplication"."status" = 'completed' THEN 1 ELSE 0 END), 0)`,
          ),
          "completedShifts",
        ],
        [
          literal(
            `COALESCE(SUM(CASE WHEN "ShiftApplication"."status" = 'no_show' THEN 1 ELSE 0 END), 0)`,
          ),
          "noShow",
        ],
        [fn("MAX", col("ShiftApplication.appliedAt")), "lastActivityAt"],
      ],
      include: [shiftInclude],
      group: ["ShiftApplication.workerId"],
      order: [[literal('"lastActivityAt"'), "DESC"]],
      limit,
      offset: (page - 1) * limit,
      raw: true,
    }),
  ]);

  const totalItems = numberOrZero(countRow?.total);
  const workerIds = rows.map((row) => row.workerId);

  const profiles = workerIds.length
    ? await User.findAll({
        where: { id: { [Op.in]: workerIds } },
        attributes: ["id", "avatar"],
        include: [
          { model: WorkerProfile, attributes: ["firstName", "lastName", "rating"] },
        ],
        raw: true,
        nest: true,
      })
    : [];
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  const data = rows.map((row) => {
    const profile = profileById.get(row.workerId);

    return {
      workerId: row.workerId,
      firstName: profile?.WorkerProfile?.firstName ?? null,
      lastName: profile?.WorkerProfile?.lastName ?? null,
      avatarUrl: profile?.avatar ?? null,
      rating: numberOrZero(profile?.WorkerProfile?.rating),
      totalApplications: numberOrZero(row.totalApplications),
      completedShifts: numberOrZero(row.completedShifts),
      noShow: numberOrZero(row.noShow),
      lastActivityAt: row.lastActivityAt,
    };
  });

  return {
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
    currentPage: page,
    data,
  };
}

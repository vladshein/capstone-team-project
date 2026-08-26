import { col, fn, literal } from "sequelize";
import {
  Location,
  Shift,
  ShiftApplication,
} from "../db/models/index.js";
import {
  numberOrZero,
  buildShiftRangeFilter,
  resolveDateRange,
  computeShiftsSeries,
} from "../helpers/statisticsHelpers.js";

export { resolveDateRange };

/**
 * Returns a worker's aggregate application and work summary.
 *
 * `WorkerProfile` is deliberately not required here: it does not contribute to
 * this response, so a worker without a completed profile can still see their
 * statistics.
 */
export async function getWorkerStatisticsSummary(
  workerId,
  { dateFrom, dateTo, companyId } = {},
) {
  const shiftWhere = buildShiftRangeFilter({ dateFrom, dateTo });
  const locationWhere = companyId === undefined ? undefined : { companyId };

  const shiftInclude = {
    model: Shift,
    attributes: [],
    required: true,
    ...(Reflect.ownKeys(shiftWhere).length ? { where: shiftWhere } : {}),
    include: [
      {
        model: Location,
        attributes: [],
        required: true,
        ...(locationWhere ? { where: locationWhere } : {}),
      },
    ],
  };

  const scheduledHours =
    'EXTRACT(EPOCH FROM ("Shift"."endTime" - "Shift"."startTime")) / 3600.0';
  const estimatedEarnings = `(${scheduledHours} * "Shift"."hourlyRate" + COALESCE("Shift"."bonusRate", 0))`;
  const completed = '"ShiftApplication"."status" = \'completed\'';

  const [applicationAggregate, workAggregate] = await Promise.all([
    ShiftApplication.findOne({
      where: { workerId },
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
      ],
      raw: true,
    }),
    ShiftApplication.findOne({
      where: { workerId },
      attributes: [
        [
          literal(
            `COALESCE(SUM(CASE WHEN "ShiftApplication"."status" = 'approved' AND "Shift"."startTime" > NOW() THEN 1 ELSE 0 END), 0)`,
          ),
          "upcoming",
        ],
        [
          literal(
            `COALESCE(SUM(CASE WHEN ${completed} THEN ${scheduledHours} ELSE 0 END), 0)`,
          ),
          "scheduledCompletedHours",
        ],
        [
          literal(
            `COALESCE(SUM(CASE WHEN ${completed} THEN ${estimatedEarnings} ELSE 0 END), 0)`,
          ),
          "estimatedCompletedEarnings",
        ],
        [
          literal(
            `COUNT(DISTINCT CASE WHEN ${completed} THEN "Shift->Location"."companyId" END)`,
          ),
          "companiesWorkedFor",
        ],
        [
          literal(`COALESCE(SUM(CASE WHEN ${completed} THEN 1 ELSE 0 END), 0)`),
          "attendanceCompleted",
        ],
        [
          literal(
            `COALESCE(SUM(CASE WHEN "ShiftApplication"."status" = 'no_show' THEN 1 ELSE 0 END), 0)`,
          ),
          "attendanceNoShow",
        ],
      ],
      include: [shiftInclude],
      raw: true,
    }),
  ]);

  const applicationValues = applicationAggregate ?? {};
  const workValues = workAggregate ?? {};
  const completedCount = numberOrZero(applicationValues.completed);
  const noShowCount = numberOrZero(applicationValues.noShow);
  const attendanceCompleted = numberOrZero(workValues.attendanceCompleted);
  const attendanceNoShow = numberOrZero(workValues.attendanceNoShow);
  const attendanceTotal = attendanceCompleted + attendanceNoShow;

  return {
    applications: {
      total: numberOrZero(applicationValues.total),
      pending: numberOrZero(applicationValues.pending),
      approved: numberOrZero(applicationValues.approved),
      rejected: numberOrZero(applicationValues.rejected),
      completed: completedCount,
      noShow: noShowCount,
    },
    shifts: {
      completed: attendanceCompleted,
      upcoming: numberOrZero(workValues.upcoming),
      scheduledCompletedHours: numberOrZero(workValues.scheduledCompletedHours),
      estimatedCompletedEarnings: numberOrZero(
        workValues.estimatedCompletedEarnings,
      ),
    },
    companiesWorkedFor: numberOrZero(workValues.companiesWorkedFor),
    attendance: {
      completed: attendanceCompleted,
      noShow: attendanceNoShow,
      rate:
        attendanceTotal === 0
          ? 0
          : (attendanceCompleted / attendanceTotal) * 100,
    },
  };
}

/**
 * Returns a worker's time-series shifts statistics grouped by period.
 *
 * The group period is derived from Shift.endTime in UTC. Only applications
 * whose attendance is resolved ("completed" or "no_show") are considered, but
 * scheduled hours and estimated earnings are summed only for "completed"
 * applications, mirroring `getWorkerStatisticsSummary` semantics.
 *
 * A single aggregated GROUP BY query feeds both the per-period `series` and
 * the aggregate `totals` (computed by summing the series in JS).
 */
export async function getWorkerShiftsStatistics(
  workerId,
  {
    dateFrom,
    dateTo,
    groupBy = "month",
    companyId,
    city,
    positionId,
    categoryId,
  } = {},
) {
  const { dateFrom: resolvedFrom, dateTo: resolvedTo } = resolveDateRange(
    dateFrom,
    dateTo,
  );

  const shiftWhere = {
    ...buildShiftRangeFilter({ dateFrom: resolvedFrom, dateTo: resolvedTo }),
  };
  if (positionId !== undefined) shiftWhere.positionId = positionId;
  if (categoryId !== undefined) shiftWhere.categoryId = categoryId;

  const locationWhere = {};
  if (companyId !== undefined) locationWhere.companyId = companyId;
  if (city !== undefined) locationWhere.city = city;

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
        ...(Reflect.ownKeys(locationWhere).length
          ? { where: locationWhere }
          : {}),
      },
    ],
  };

  const series = await computeShiftsSeries({
    where: { workerId },
    include: [shiftInclude],
    groupBy,
    moneyField: "estimatedEarnings",
  });

  const totals = series.reduce(
    (acc, p) => {
      acc.completedShifts += p.completedShifts;
      acc.noShows += p.noShows;
      acc.scheduledCompletedHours += p.scheduledHours;
      acc.estimatedCompletedEarnings += p.estimatedEarnings;
      return acc;
    },
    {
      completedShifts: 0,
      noShows: 0,
      scheduledCompletedHours: 0,
      estimatedCompletedEarnings: 0,
    },
  );

  return { totals, series };
}

import { Op, col, fn, literal } from "sequelize";
import {
  Location,
  Shift,
  ShiftApplication,
  Wallet,
} from "../db/models/index.js";

const numberOrZero = (value) => Number(value ?? 0);

const buildShiftRangeFilter = ({ dateFrom, dateTo }) => {
  const conditions = [];

  // A shift belongs to the requested period when its interval overlaps it.
  // This includes shifts that start in the period, end in it, or span it.
  if (dateFrom) conditions.push({ endTime: { [Op.gte]: dateFrom } });
  if (dateTo) conditions.push({ startTime: { [Op.lte]: dateTo } });

  return conditions.length ? { [Op.and]: conditions } : {};
};

/**
 * Returns a worker's aggregate application and work summary.
 *
 * `WorkerProfile` is deliberately not required here: it does not contribute to
 * this response, so a worker without a completed profile can still see their
 * statistics. Wallet values are a current balance snapshot, not earnings.
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

  const [applicationAggregate, workAggregate, wallet] = await Promise.all([
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
    Wallet.findOne({
      where: { userId: workerId },
      attributes: ["balance", "frozenBalance"],
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
      completed: completedCount,
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
    wallet: wallet
      ? {
          balance: numberOrZero(wallet.balance),
          frozenBalance: numberOrZero(wallet.frozenBalance),
        }
      : null,
  };
}

import { Op, literal } from "sequelize";
import { ShiftApplication } from "../db/models/index.js";

export const numberOrZero = (value) => Number(value ?? 0);

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A bare "YYYY-MM-DD" `dateTo` parses to UTC midnight, which would exclude
 * every shift that starts later that same day. Bump date-only values to the
 * end of that day; a value that already carries a time component (or is
 * already a Date) is returned unchanged.
 */
const toRangeEnd = (value) => {
  if (typeof value !== "string" || !DATE_ONLY_PATTERN.test(value)) return value;

  const date = new Date(value);
  date.setUTCHours(23, 59, 59, 999);
  return date;
};

export const buildShiftRangeFilter = ({ dateFrom, dateTo }) => {
  const conditions = [];

  // A shift belongs to the requested period when its interval overlaps it.
  // This includes shifts that start in the period, end in it, or span it.
  if (dateFrom) conditions.push({ endTime: { [Op.gte]: dateFrom } });
  if (dateTo) conditions.push({ startTime: { [Op.lte]: toRangeEnd(dateTo) } });

  return conditions.length ? { [Op.and]: conditions } : {};
};

const DEFAULT_RANGE_MONTHS = 3;

/**
 * Picks a fallback period when one of `dateFrom`/`dateTo` is missing so the
 * query always runs over a bounded window (last 3 months by default).
 */
export const resolveDateRange = (dateFrom, dateTo) => {
  let from = dateFrom ? new Date(dateFrom) : null;
  let to = dateTo ? new Date(toRangeEnd(dateTo)) : null;

  if (!from && !to) {
    to = new Date();
    from = new Date(to);
    from.setMonth(from.getMonth() - DEFAULT_RANGE_MONTHS);
  } else if (from && !to) {
    to = new Date();
  } else if (!from && to) {
    from = new Date(to);
    from.setMonth(from.getMonth() - DEFAULT_RANGE_MONTHS);
  }

  return { dateFrom: from, dateTo: to };
};

export const scheduledHoursSql = () =>
  'EXTRACT(EPOCH FROM ("Shift"."endTime" - "Shift"."startTime")) / 3600.0';

export const estimatedEarningsSql = (hoursExpr = scheduledHoursSql()) =>
  `(${hoursExpr} * "Shift"."hourlyRate" + COALESCE("Shift"."bonusRate", 0))`;

export const periodExpressionSql = (groupBy) =>
  groupBy === "week"
    ? `to_char("Shift"."endTime" AT TIME ZONE 'UTC', 'IYYY-"W"IW')`
    : `to_char("Shift"."endTime" AT TIME ZONE 'UTC', 'YYYY-MM')`;

/**
 * Shared "completed/no_show shifts grouped by period" query behind both the
 * worker and business shifts-dynamics endpoints. `where` narrows
 * ShiftApplication rows beyond status (e.g. `{ workerId }` for a worker,
 * `{}` for a business scoped entirely through `include`). `include` is the
 * caller's own Shift/Location include chain — the date range, company
 * scope, and worker-only position/category/city filters differ per caller
 * and stay there. `moneyField` names the money key in each returned period,
 * since callers use different terminology for the same computed value
 * ("estimatedEarnings" for a worker's own earnings, "spend" for what a
 * business paid out) — the totals reduction stays with the caller too,
 * since its output key names differ the same way.
 */
export async function computeShiftsSeries({ where = {}, include, groupBy, moneyField }) {
  const periodExpression = periodExpressionSql(groupBy);
  const hoursExpr = scheduledHoursSql();
  const earningsExpr = estimatedEarningsSql(hoursExpr);

  const rows = await ShiftApplication.findAll({
    where: { ...where, status: { [Op.in]: ["completed", "no_show"] } },
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
          `COALESCE(SUM(CASE WHEN "ShiftApplication"."status" = 'completed' THEN ${hoursExpr} ELSE 0 END), 0)`,
        ),
        "scheduledHours",
      ],
      [
        literal(
          `COALESCE(SUM(CASE WHEN "ShiftApplication"."status" = 'completed' THEN ${earningsExpr} ELSE 0 END), 0)`,
        ),
        moneyField,
      ],
    ],
    include,
    group: [literal(periodExpression)],
    order: [["period", "ASC"]],
    raw: true,
  });

  return (rows ?? []).map((row) => ({
    period: row.period,
    completedShifts: numberOrZero(row.completedShifts),
    noShows: numberOrZero(row.noShows),
    scheduledHours: numberOrZero(row.scheduledHours),
    [moneyField]: numberOrZero(row[moneyField]),
  }));
}

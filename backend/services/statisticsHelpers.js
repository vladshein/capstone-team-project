import { Op } from "sequelize";

export const numberOrZero = (value) => Number(value ?? 0);

export const buildShiftRangeFilter = ({ dateFrom, dateTo }) => {
  const conditions = [];

  // A shift belongs to the requested period when its interval overlaps it.
  // This includes shifts that start in the period, end in it, or span it.
  if (dateFrom) conditions.push({ endTime: { [Op.gte]: dateFrom } });
  if (dateTo) conditions.push({ startTime: { [Op.lte]: dateTo } });

  return conditions.length ? { [Op.and]: conditions } : {};
};

const DEFAULT_RANGE_MONTHS = 3;

/**
 * Picks a fallback period when one of `dateFrom`/`dateTo` is missing so the
 * query always runs over a bounded window (last 3 months by default).
 */
export const resolveDateRange = (dateFrom, dateTo) => {
  let from = dateFrom ? new Date(dateFrom) : null;
  let to = dateTo ? new Date(dateTo) : null;

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

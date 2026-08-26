import { getBusinessStatisticsBundle, resolveDateRange } from "../services/businessStatisticsServices.js";
import isValidIsoDate from "../helpers/isValidIsoDate.js";
import exceedsMaxRangeMonths from "../helpers/exceedsMaxRangeMonths.js";

const parseCompanyId = (companyIdQuery) => {
  if (companyIdQuery === undefined) return { ok: true, value: undefined };

  const companyId = Number(companyIdQuery);
  if (!Number.isInteger(companyId)) return { ok: false };

  return { ok: true, value: companyId };
};

/**
 * Combined summary + shifts + workers endpoint behind the business
 * statistics page. Replaces what used to be three separate endpoints so the
 * page's initial load resolves the owner's company scope once instead of
 * three times — the tradeoff is that summary/shifts/workers now always load
 * and reload together (e.g. switching the workers table page also re-fetches
 * summary and the shifts chart).
 */
export const getStatistics = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, groupBy, companyId: companyIdQuery } = req.query;

    if (dateFrom !== undefined && !isValidIsoDate(dateFrom)) {
      return res.status(400).json({ message: "dateFrom must be a valid ISO date." });
    }

    if (dateTo !== undefined && !isValidIsoDate(dateTo)) {
      return res.status(400).json({ message: "dateTo must be a valid ISO date." });
    }

    if (groupBy !== undefined && groupBy !== "week" && groupBy !== "month") {
      return res.status(400).json({ message: "groupBy must be 'week' or 'month'." });
    }

    const companyId = parseCompanyId(companyIdQuery);
    if (!companyId.ok) {
      return res.status(400).json({ message: "companyId must be an integer." });
    }

    const { dateFrom: resolvedFrom, dateTo: resolvedTo } = resolveDateRange(
      dateFrom,
      dateTo,
    );
    if (resolvedFrom > resolvedTo) {
      return res.status(400).json({ message: "dateFrom must be earlier than dateTo." });
    }
    if (exceedsMaxRangeMonths(resolvedFrom, resolvedTo, 12)) {
      return res.status(400).json({ message: "Date range must not exceed 12 months." });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

    const statistics = await getBusinessStatisticsBundle(req.user.id, {
      dateFrom,
      dateTo,
      groupBy,
      companyId: companyId.value,
      page,
      limit,
    });

    // Пагінація воркерів у відповіді — не варто кешувати проміжну сторінку.
    res.set("Cache-Control", "no-store");
    res.status(200).json({ data: statistics });
  } catch (error) {
    next(error);
  }
};

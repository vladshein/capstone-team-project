import {
  getBusinessStatisticsSummary,
  getBusinessShiftsStatistics,
  getBusinessWorkersStatistics,
  resolveDateRange,
} from "../services/businessStatistics.service.js";
import isValidIsoDate from "../helpers/isValidIsoDate.js";

const parseCompanyId = (companyIdQuery) => {
  if (companyIdQuery === undefined) return { ok: true, value: undefined };

  const companyId = Number(companyIdQuery);
  if (!Number.isInteger(companyId)) return { ok: false };

  return { ok: true, value: companyId };
};

export const getStatisticsSummary = async (req, res, next) => {
  try {
    const { companyId: companyIdQuery } = req.query;
    const companyId = parseCompanyId(companyIdQuery);

    if (!companyId.ok) {
      return res.status(400).json({ message: "companyId must be an integer." });
    }

    const statistics = await getBusinessStatisticsSummary(req.user.id, {
      companyId: companyId.value,
    });

    res.status(200).json({ data: statistics });
  } catch (error) {
    next(error);
  }
};

export const getShiftsStatistics = async (req, res, next) => {
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
    const rangeMonths =
      (resolvedTo.getFullYear() - resolvedFrom.getFullYear()) * 12 +
      (resolvedTo.getMonth() - resolvedFrom.getMonth());
    if (rangeMonths > 12) {
      return res.status(400).json({ message: "Date range must not exceed 12 months." });
    }

    const statistics = await getBusinessShiftsStatistics(req.user.id, {
      dateFrom,
      dateTo,
      groupBy,
      companyId: companyId.value,
    });

    res.status(200).json({ data: statistics });
  } catch (error) {
    next(error);
  }
};

export const getWorkersStatistics = async (req, res, next) => {
  try {
    const { companyId: companyIdQuery } = req.query;
    const companyId = parseCompanyId(companyIdQuery);

    if (!companyId.ok) {
      return res.status(400).json({ message: "companyId must be an integer." });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

    const statistics = await getBusinessWorkersStatistics(req.user.id, {
      companyId: companyId.value,
      page,
      limit,
    });

    res.set("Cache-Control", "no-store");
    res.status(200).json({ data: statistics });
  } catch (error) {
    next(error);
  }
};

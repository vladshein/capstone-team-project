import * as workerProfileService from "../services/workerProfileServices.js";
import {
  getWorkerStatisticsSummary,
  getWorkerShiftsStatistics,
  resolveDateRange,
} from "../services/workerStatistics.service.js";
import isValidIsoDate from "../helpers/isValidIsoDate.js";

export const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profile = await workerProfileService.getProfileByUserId(userId);

    if (!profile) {
      return res.status(404).json({ message: "Профіль ще не створено" });
    }

    res.status(200).json({
      message: "Профіль успішно отримано",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicProfile = async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(400).json({ message: "Некоректний ідентифікатор виконавця" });
    }

    const profile = await workerProfileService.getPublicProfileByUserId(userId, {
      includePhone: Boolean(req.user),
    });
    res.status(200).json({ data: profile });
  } catch (error) {
    next(error);
  }
};

export const getStatisticsSummary = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, companyId: companyIdQuery } = req.query;

    if (dateFrom !== undefined && !isValidIsoDate(dateFrom)) {
      return res.status(400).json({
        message: "dateFrom must be a valid ISO date.",
      });
    }

    if (dateTo !== undefined && !isValidIsoDate(dateTo)) {
      return res.status(400).json({
        message: "dateTo must be a valid ISO date.",
      });
    }

    let companyId;
    if (companyIdQuery !== undefined) {
      companyId = Number(companyIdQuery);
      if (!Number.isInteger(companyId)) {
        return res.status(400).json({
          message: "companyId must be an integer.",
        });
      }
    }

    const statistics = await getWorkerStatisticsSummary(req.user.id, {
      dateFrom,
      dateTo,
      companyId,
    });

    res.status(200).json({ data: statistics });
  } catch (error) {
    next(error);
  }
};

export const getShiftsStatistics = async (req, res, next) => {
  try {
    const {
      dateFrom,
      dateTo,
      groupBy,
      companyId: companyIdQuery,
      city,
      positionId,
      categoryId,
    } = req.query;

    if (dateFrom !== undefined && !isValidIsoDate(dateFrom)) {
      return res.status(400).json({
        message: "dateFrom must be a valid ISO date.",
      });
    }

    if (dateTo !== undefined && !isValidIsoDate(dateTo)) {
      return res.status(400).json({
        message: "dateTo must be a valid ISO date.",
      });
    }

    if (groupBy !== undefined && groupBy !== "week" && groupBy !== "month") {
      return res.status(400).json({
        message: "groupBy must be 'week' or 'month'.",
      });
    }

    let companyId;
    if (companyIdQuery !== undefined) {
      companyId = Number(companyIdQuery);
      if (!Number.isInteger(companyId)) {
        return res.status(400).json({
          message: "companyId must be an integer.",
        });
      }
    }

    let positionIdValue;
    if (positionId !== undefined) {
      positionIdValue = Number(positionId);
      if (!Number.isInteger(positionIdValue)) {
        return res.status(400).json({
          message: "positionId must be an integer.",
        });
      }
    }

    const { dateFrom: resolvedFrom, dateTo: resolvedTo } = resolveDateRange(
      dateFrom,
      dateTo,
    );
    if (resolvedFrom > resolvedTo) {
      return res.status(400).json({
        message: "dateFrom must be earlier than dateTo.",
      });
    }
    // Порівняння лише номерів місяців дає хибний результат на межі місяця
    // (наприклад, 390 днів може виглядати як рівно 12 календарних місяців).
    // Віднімаємо рівно один рік від кінцевої точки діапазону.
    const oldestAllowedDate = new Date(resolvedTo);
    oldestAllowedDate.setFullYear(oldestAllowedDate.getFullYear() - 1);
    if (resolvedFrom < oldestAllowedDate) {
      return res.status(400).json({
        message: "Date range must not exceed 12 months.",
      });
    }

    const statistics = await getWorkerShiftsStatistics(req.user.id, {
      dateFrom,
      dateTo,
      groupBy,
      companyId,
      city,
      positionId: positionIdValue,
      categoryId,
    });

    res.status(200).json({ data: statistics });
  } catch (error) {
    next(error);
  }
};

export const createMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Перевіряємо роль, щоб бізнес не міг створити анкету робітника
    if (req.user.role !== "worker") {
      const error = new Error("Тільки робітники можуть створювати цей профіль");
      error.status = 403;
      throw error;
    }

    const newProfile = await workerProfileService.createProfile(
      userId,
      req.body,
    );

    res.status(201).json({
      message: "Профіль робітника успішно створено",
      data: newProfile,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updatedProfile = await workerProfileService.updateProfile(
      userId,
      req.body,
    );

    res.status(200).json({
      message: "Профіль успішно оновлено",
      data: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

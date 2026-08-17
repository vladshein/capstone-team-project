import * as workerProfileService from "../services/workerProfileServices.js";
import { getWorkerStatisticsSummary } from "../services/worker-statistics.service.js";

const isValidIsoDate = (value) => {
  if (typeof value !== "string") return false;

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/,
  );
  if (!match || Number.isNaN(Date.parse(value))) return false;

  const [, year, month, day] = match.map(Number);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));

  return (
    calendarDate.getUTCFullYear() === year &&
    calendarDate.getUTCMonth() === month - 1 &&
    calendarDate.getUTCDate() === day
  );
};

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

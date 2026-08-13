import * as shiftService from "../services/shiftServices.js";

const parseList = (value) =>
  typeof value === "string"
    ? value.split(",").map((item) => item.trim()).filter(Boolean)
    : Array.isArray(value)
      ? value.map(String).map((item) => item.trim()).filter(Boolean)
      : undefined;

const parseShiftFilters = (query) => {
  const {
    minPrice,
    maxPrice,
    categoryId,
    categoryIds,
    partners,
    city,
    dateFrom,
    dateTo,
    durationFilters,
    sort,
    latitude,
    longitude,
    radiusKm,
  } = query;

  return {
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
    categoryIds: parseList(categoryIds),
    partners: parseList(partners),
    city: typeof city === "string" ? city.trim() || undefined : undefined,
    dateFrom: typeof dateFrom === "string" && !Number.isNaN(Date.parse(dateFrom)) ? dateFrom : undefined,
    dateTo: typeof dateTo === "string" && !Number.isNaN(Date.parse(dateTo)) ? dateTo : undefined,
    durationFilters: parseList(durationFilters),
    sort: ["relevance", "price_desc", "date_asc", "date_desc", "nearest"].includes(sort)
      ? sort
      : "relevance",
    latitude: Number.isFinite(Number(latitude)) ? Number(latitude) : undefined,
    longitude: Number.isFinite(Number(longitude)) ? Number(longitude) : undefined,
    radiusKm: Number.isFinite(Number(radiusKm))
      ? Math.min(Math.max(Number(radiusKm), 1), 50)
      : undefined,
  };
};

/**
 * Обробляє запит на отримання всіх змін.
 * Витягує параметри запиту та формує HTTP-відповідь.
 */
export const getAllShifts = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

    const result = await shiftService.getAllShifts({
      page,
      limit,
      ...parseShiftFilters(req.query),
    });

    // 3. Відправляємо успішну відповідь
    res.status(200).json(result);
  } catch (error) {
    next(error); // Передаємо помилку в центральний errorHandler
  }
};

/**
 * Повертає мінімальні дані для маркерів на карті за тими самими фільтрами,
 * що й список змін. Пагінація списку на цей endpoint не впливає.
 */
export const getShiftMapMarkers = async (req, res, next) => {
  try {
    const filters = parseShiftFilters(req.query);
    const hasRadiusSearch =
      Number.isFinite(filters.latitude) &&
      Number.isFinite(filters.longitude) &&
      Boolean(filters.radiusKm);

    if (!filters.city && !hasRadiusSearch) {
      return res.status(400).json({
        message: "Для карти потрібно визначити місто або локацію користувача.",
      });
    }

    const result = await shiftService.getShiftMapMarkers(filters);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Обробляє запит на отримання конкретної зміни за ID.
 */
export const getShiftById = async (req, res, next) => {
  try {
    const shiftId = req.params.id;

    // Передаємо запит у Service layer
    const shift = await shiftService.getShiftById(shiftId);

    if (!shift) {
      const error = new Error("Shift not found.");
      error.status = 404;
      throw error;
    }

    res.status(200).json(shift);
  } catch (error) {
    next(error); // Передаємо помилку в центральний errorHandler
  }
};

/** Повертає активні або архівні зміни конкретної компанії-власника. */
export const getBusinessShifts = async (req, res, next) => {
  try {
    const companyId = Number(req.query.companyId);
    if (!Number.isInteger(companyId) || companyId < 1) {
      return res.status(400).json({ message: "Потрібно вказати коректну компанію." });
    }

    const scope = req.query.scope === "archive" ? "archive" : "active";
    const shifts = await shiftService.getBusinessShifts({
      companyId,
      ownerId: req.user.id,
      scope,
    });

    res.status(200).json({ data: shifts });
  } catch (error) {
    next(error);
  }
};

/** Повертає заявки виконавців на зміни вказаної компанії. */
export const getBusinessShiftApplications = async (req, res, next) => {
  try {
    const companyId = Number(req.query.companyId);
    if (!Number.isInteger(companyId) || companyId < 1) {
      return res.status(400).json({ message: "Потрібно вказати коректну компанію." });
    }

    const applications = await shiftService.getBusinessShiftApplications({
      companyId,
      ownerId: req.user.id,
    });

    res.status(200).json({ data: applications });
  } catch (error) {
    next(error);
  }
};

/**
 * Обробляє запит на створення нової зміни (тільки для замовників/бізнесу).
 */
export const createShift = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Всі дані вже провалідовані через Joi у validateBody
    const {
      locationId,
      positionId,
      categoryId,
      startTime,
      endTime,
      hourlyRate,
      bonusRate,
      description,
    } = req.body;

    // 1. Перевірка безпеки: чи належить ця локація цьому користувачу?
    const hasLocationAccess = await shiftService.verifyLocationOwnership(
      locationId,
      userId,
    );
    if (!hasLocationAccess) {
      const error = new Error(
        "У вас немає прав створювати зміну на цій локації.",
      );
      error.status = 403; // Forbidden
      throw error;
    }

    // 2. Створення зміни
    const newShift = await shiftService.createShift({
      locationId,
      positionId,
      categoryId,
      startTime,
      endTime,
      hourlyRate,
      bonusRate: bonusRate || 0.0,
      description,
      status: "open", // За замовчуванням нова зміна є відкритою
    });

    res.status(201).json({
      message: "Зміну успішно створено",
      data: newShift,
    });
  } catch (error) {
    next(error); // Передаємо помилку в центральний errorHandler
  }
};

/**
 * Створює відгук виконавця на відкриту зміну.
 */
export const applyToShift = async (req, res, next) => {
  try {
    const shiftId = Number(req.params.id);
    const workerId = req.user.id;
    const shift = await shiftService.getShiftById(shiftId);

    if (!shift) {
      const error = new Error("Зміну не знайдено.");
      error.status = 404;
      throw error;
    }

    if (shift.status !== "open") {
      const error = new Error("На цю зміну вже не можна відгукнутися.");
      error.status = 400;
      throw error;
    }

    if (new Date(shift.startTime) <= new Date()) {
      const error = new Error("Відгукнутися можна лише до початку зміни.");
      error.status = 400;
      throw error;
    }

    const existingApplication = await shiftService.findShiftApplication(
      shiftId,
      workerId,
    );
    if (existingApplication) {
      const error = new Error("Ви вже відгукнулися на цю зміну.");
      error.status = 409;
      throw error;
    }

    const application = await shiftService.createShiftApplication(
      shiftId,
      workerId,
    );

    res.status(201).json({
      message: "Відгук на зміну надіслано.",
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

/** Відкликати власну заявку на зміну до її початку. */
export const cancelWorkerApplication = async (req, res, next) => {
  try {
    const applicationId = Number(req.params.applicationId);
    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      const error = new Error("Некоректний ідентифікатор заявки.");
      error.status = 400;
      throw error;
    }

    const result = await shiftService.cancelWorkerShiftApplication(applicationId, req.user.id);
    if (result.reason === "not_found") {
      const error = new Error("Заявку не знайдено.");
      error.status = 404;
      throw error;
    }
    if (result.reason === "status") {
      const error = new Error("Цю заявку вже не можна скасувати.");
      error.status = 400;
      throw error;
    }
    if (result.reason === "started") {
      const error = new Error("Не можна скасувати заявку після початку зміни.");
      error.status = 400;
      throw error;
    }

    res.status(200).json({ message: "Заявку скасовано." });
  } catch (error) {
    next(error);
  }
};

/**
 * Обробляє запит на оновлення зміни (тільки для власника)
 */
export const updateShift = async (req, res, next) => {
  try {
    const shiftId = req.params.id;
    const userId = req.user.id;

    // 1. Отримуємо зміну
    const shift = await shiftService.getShiftById(shiftId);
    if (!shift) {
      const error = new Error("Зміну не знайдено.");
      error.status = 404;
      throw error;
    }

    // 2. Перевірка власника (через зв'язки Shift -> Location -> Company)
    if (shift.Location.Company.ownerId !== userId) {
      const error = new Error("У вас немає прав на редагування цієї зміни.");
      error.status = 403;
      throw error;
    }

    // 3. Бізнес-логіка: забороняємо редагувати зміну, якщо вона вже заброньована або завершена
    if (shift.status !== "open") {
      const error = new Error(
        "Не можна редагувати зміну, яка вже заброньована робітником або завершена.",
      );
      error.status = 400; // Bad Request
      throw error;
    }

    // 4. Оновлення
    const updatedShift = await shiftService.updateShift(shiftId, req.body);

    res.status(200).json({
      message: "Зміну успішно оновлено",
      data: updatedShift,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Обробляє запит на скасування зміни
 */
export const cancelShift = async (req, res, next) => {
  try {
    const shiftId = req.params.id;
    const userId = req.user.id;

    const shift = await shiftService.getShiftById(shiftId);
    if (!shift) {
      const error = new Error("Зміну не знайдено.");
      error.status = 404;
      throw error;
    }

    // Перевірка власника
    if (shift.Location.Company.ownerId !== userId) {
      const error = new Error("У вас немає прав на скасування цієї зміни.");
      error.status = 403;
      throw error;
    }

    // Якщо вона вже скасована або успішно завершена
    if (shift.status === "cancelled" || shift.status === "completed") {
      const error = new Error(
        "Цю зміну не можна скасувати, вона вже завершена або скасована раніше.",
      );
      error.status = 400;
      throw error;
    }

    // TODO в майбутньому: якщо статус був 'booked' (робітник вже знайшовся),
    // тут треба додати логіку повернення коштів з холду (Frozen Balance) на звичайний баланс бізнесу.

    const cancelledShift = await shiftService.cancelShift(shiftId);

    res.status(200).json({
      message: "Зміну успішно скасовано",
      data: cancelledShift,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Обробляє запит на отримання історії взятих робіт для робітника.
 */
export const getWorkerShifts = async (req, res, next) => {
  try {
    const workerId = req.user.id;
    const { page, limit, status, shiftId, scope } = req.query;

    const result = await shiftService.getWorkerShiftHistory(workerId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      status, // Можна передавати '?status=approved' для актуальних або '?status=completed' для завершених
      shiftId: shiftId ? parseInt(shiftId, 10) : undefined,
      scope: scope === "archive" ? "archive" : "active",
    });

    res.status(200).json({
      message: "Історію робіт успішно отримано",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

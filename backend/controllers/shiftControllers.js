import * as shiftService from "../services/shiftServices.js";

/**
 * Обробляє запит на отримання всіх змін.
 * Витягує параметри запиту та формує HTTP-відповідь.
 */
export const getAllShifts = async (req, res, next) => {
  try {
    // 1. Отримуємо параметри з Query рядка
    const { page = 1, limit = 10, minPrice, maxPrice, categoryId, categoryIds } = req.query;

    // 2. Передаємо параметри в Service layer
    const result = await shiftService.getAllShifts({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
      categoryIds: typeof categoryIds === "string"
        ? categoryIds.split(",").filter(Boolean)
        : Array.isArray(categoryIds)
          ? categoryIds.filter(Boolean)
          : undefined,
    });

    // 3. Відправляємо успішну відповідь
    res.status(200).json(result);
  } catch (error) {
    next(error); // Передаємо помилку в центральний errorHandler
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
    const companyId = await shiftService.verifyLocationOwnership(
      locationId,
      userId,
    );
    if (!companyId) {
      const error = new Error(
        "У вас немає прав створювати зміну на цій локації.",
      );
      error.status = 403; // Forbidden
      throw error;
    }

    // 2. Створення зміни
    const newShift = await shiftService.createShift({
      companyId,
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
    const { page, limit, status } = req.query;

    const result = await shiftService.getWorkerShiftHistory(workerId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      status, // Можна передавати '?status=approved' для актуальних або '?status=completed' для завершених
    });

    res.status(200).json({
      message: "Історію робіт успішно отримано",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

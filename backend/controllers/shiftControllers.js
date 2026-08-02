import * as shiftService from "../services/shiftServices.js";

/**
 * Обробляє запит на отримання всіх змін.
 * Витягує параметри запиту та формує HTTP-відповідь.
 */
export const getAllShifts = async (req, res, next) => {
  try {
    // 1. Отримуємо параметри з Query рядка
    const { page = 1, limit = 10, minPrice, maxPrice, categoryId } = req.query;

    // 2. Передаємо параметри в Service layer
    const result = await shiftService.getAllShifts({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
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
    // В реальному додатку userId ми беремо з токена авторизації (наприклад req.user.id)
    // Для тестування поки захардкодимо ID власника "Сільпо" (id: 1) з наших сідів.
    const userId = req.user?.id || 1;

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

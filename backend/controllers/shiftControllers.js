import * as shiftService from "../services/shiftServices.js";

/**
 * Обробляє запит на отримання всіх змін.
 * Витягує параметри запиту та формує HTTP-відповідь.
 */
export const getAllShifts = async (req, res) => {
  try {
    // 1. Отримуємо параметри з Query рядка
    const { page = 1, limit = 10, minPrice, maxPrice, categoryId } = req.query;

    // 2. Передаємо параметри в Service layer
    const result = await shiftService.getShifts({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
    });

    // 3. Відправляємо успішну відповідь
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in ShiftController.getAllShifts:", error);
    res
      .status(500)
      .json({ message: "Internal server error while fetching shifts." });
  }
};

/**
 * Обробляє запит на отримання конкретної зміни за ID.
 */
export const getShiftById = async (req, res) => {
  try {
    const shiftId = req.params.id;

    // Передаємо запит у Service layer
    const shift = await shiftService.getShiftById(shiftId);

    if (!shift) {
      return res.status(404).json({ message: "Shift not found." });
    }

    res.status(200).json(shift);
  } catch (error) {
    console.error(
      `Error in ShiftController.getShiftById (${req.params.id}):`,
      error,
    );
    res
      .status(500)
      .json({ message: "Internal server error while fetching the shift." });
  }
};

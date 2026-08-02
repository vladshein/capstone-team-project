import { Op } from "sequelize";
import {
  Shift,
  Location,
  Company,
  JobPosition,
  Category,
} from "../db/models/index.js";

/**
 * Отримує зміни з бази даних на основі фільтрів та пагінації.
 * Містить всю логіку запитів до БД.
 */
export const getAllShifts = async ({
  page,
  limit,
  minPrice,
  maxPrice,
  categoryId,
}) => {
  console.log("[shiftsService] getAllShifts called with params:", {
    page,
    limit,
    minPrice,
    maxPrice,
    categoryId,
  });

  // Приводимо page/limit до чисел і підстраховуємось дефолтами,
  // бо з query-стрінги вони завжди приходять як string або undefined
  const parsedPage = Number.parseInt(page, 10) || 1;
  const parsedLimit = Number.parseInt(limit, 10) || 20;
  const offset = (parsedPage - 1) * parsedLimit;

  console.log("[shiftsService] parsed pagination:", {
    parsedPage,
    parsedLimit,
    offset,
  });

  // Базова умова: показувати тільки відкриті зміни
  const whereCondition = {
    status: "open",
  };

  // Фільтрація за категорією
  if (categoryId) {
    whereCondition.categoryId = categoryId;
  }

  // Фільтрація за ціною
  if (minPrice !== undefined && maxPrice !== undefined) {
    whereCondition.hourlyRate = { [Op.between]: [minPrice, maxPrice] };
  } else if (minPrice !== undefined) {
    whereCondition.hourlyRate = { [Op.gte]: minPrice };
  } else if (maxPrice !== undefined) {
    whereCondition.hourlyRate = { [Op.lte]: maxPrice };
  }

  console.log("[shiftsService] whereCondition:", whereCondition);

  try {
    // Виконання запиту з підключенням зв'язаних таблиць (Eager Loading)
    const { count, rows } = await Shift.findAndCountAll({
      where: whereCondition,
      limit: parsedLimit,
      offset: offset,
      order: [["startTime", "ASC"]],
      include: [
        { model: Category, attributes: ["id", "name"] },
        { model: JobPosition, attributes: ["id", "title"] },
        {
          model: Location,
          attributes: ["id", "title", "address", "city"],
          include: [{ model: Company, attributes: ["id", "name"] }],
        },
      ],
    });

    console.log(
      `[shiftsService] found ${count} shift(s), returning page ${parsedPage} (${rows.length} row(s))`,
    );

    // Форматування об'єкта результату
    return {
      totalItems: count,
      totalPages: Math.ceil(count / parsedLimit),
      currentPage: parsedPage,
      data: rows,
    };
  } catch (error) {
    console.error("[shiftsService] Failed to fetch shifts:", {
      message: error.message,
      name: error.name,
      sql: error.sql, // з'явиться, якщо це SequelizeDatabaseError
      original: error.original?.message, // реальна помилка з драйвера БД
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Отримує одну зміну за її Primary Key зі зв'язаними даними.
 */
export const getShiftById = async (shiftId) => {
  return await Shift.findByPk(shiftId, {
    include: [
      { model: Category, attributes: ["id", "name"] },
      { model: JobPosition, attributes: ["id", "title", "description"] },
      {
        model: Location,
        attributes: ["id", "title", "address", "city", "latitude", "longitude"],
        // ДОДАНО ownerId, щоб ми могли перевіряти права доступу
        include: [
          { model: Company, attributes: ["id", "name", "edrpou", "ownerId"] },
        ],
      },
    ],
  });
};

/**
 * Перевіряє, чи належить локація компанії, власником якої є користувач.
 * Це необхідно для захисту від створення змін на чужих локаціях.
 */
export const verifyLocationOwnership = async (locationId, userId) => {
  const location = await Location.findByPk(locationId, {
    include: [
      {
        model: Company,
        attributes: ["id", "ownerId"],
      },
    ],
  });

  // Якщо локації немає, або ownerId компанії не збігається з userId того, хто робить запит
  if (!location || location.Company.ownerId !== userId) {
    return false;
  }

  return location.Company.id;
};

/**
 * Створює нову зміну в базі даних.
 */
export const createShift = async (shiftData) => {
  return await Shift.create(shiftData);
};

/**
 * Оновлює існуючу зміну
 */
export const updateShift = async (shiftId, updateData) => {
  const shift = await Shift.findByPk(shiftId);
  if (!shift) return null;
  return await shift.update(updateData);
};

/**
 * Переводить зміну в статус скасованої
 */
export const cancelShift = async (shiftId) => {
  const shift = await Shift.findByPk(shiftId);
  if (!shift) return null;
  return await shift.update({ status: "cancelled" });
};

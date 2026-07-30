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
export const getShifts = async ({
  page,
  limit,
  minPrice,
  maxPrice,
  categoryId,
}) => {
  const offset = (page - 1) * limit;

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

  // Виконання запиту з підключенням зв'язаних таблиць (Eager Loading)
  const { count, rows } = await Shift.findAndCountAll({
    where: whereCondition,
    limit: limit,
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

  // Форматування об'єкта результату
  return {
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    data: rows,
  };
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
        include: [{ model: Company, attributes: ["id", "name", "edrpou"] }],
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
        attributes: ["ownerId"],
      },
    ],
  });

  // Якщо локації немає, або ownerId компанії не збігається з userId того, хто робить запит
  if (!location || location.Company.ownerId !== userId) {
    return false;
  }
  return true;
};

/**
 * Створює нову зміну в базі даних.
 */
export const createShift = async (shiftData) => {
  return await Shift.create(shiftData);
};

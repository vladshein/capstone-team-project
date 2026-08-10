import { Op, col, fn, literal, where } from "sequelize";
import {
  Shift,
  Location,
  Company,
  JobPosition,
  Category,
  ShiftApplication,
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
  categoryIds,
  partners,
  city,
  dateFrom,
  dateTo,
  durationFilters,
  sort = "relevance",
  latitude,
  longitude,
}) => {
  console.log("[shiftsService] getAllShifts called with params:", {
    page,
    limit,
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
  if (categoryIds?.length) {
    whereCondition.categoryId = { [Op.in]: categoryIds.map(String) };
  } else if (categoryId) {
    // categoryId успадковує тип TEXT від Category.id у поточній схемі БД.
    whereCondition.categoryId = String(categoryId);
  }

  // Фільтрація за ціною
  if (minPrice !== undefined && maxPrice !== undefined) {
    whereCondition.hourlyRate = { [Op.between]: [minPrice, maxPrice] };
  } else if (minPrice !== undefined) {
    whereCondition.hourlyRate = { [Op.gte]: minPrice };
  } else if (maxPrice !== undefined) {
    whereCondition.hourlyRate = { [Op.lte]: maxPrice };
  }

  if (dateFrom || dateTo) {
    whereCondition.startTime = {};
    if (dateFrom) whereCondition.startTime[Op.gte] = dateFrom;
    if (dateTo) whereCondition.startTime[Op.lt] = dateTo;
  }

  const durationHours = 'EXTRACT(EPOCH FROM ("Shift"."endTime" - "Shift"."startTime")) / 3600';
  const durationConditions = [];
  if (durationFilters?.includes("До 4 год")) {
    durationConditions.push(where(literal(durationHours), { [Op.lte]: 4 }));
  }
  if (durationFilters?.includes("4–8 год")) {
    durationConditions.push(
      where(literal(durationHours), { [Op.gt]: 4, [Op.lte]: 8 }),
    );
  }
  if (durationFilters?.includes("Понад 8 год")) {
    durationConditions.push(where(literal(durationHours), { [Op.gt]: 8 }));
  }
  if (durationConditions.length) whereCondition[Op.or] = durationConditions;

  const companyInclude = {
    model: Company,
    attributes: ["id", "name"],
  };
  if (partners?.length) {
    companyInclude.where = { name: { [Op.in]: partners } };
    companyInclude.required = true;
  }

  const locationInclude = {
    model: Location,
    attributes: ["id", "title", "address", "city", "latitude", "longitude"],
    include: [companyInclude],
  };
  if (city) {
    locationInclude.where = { city: { [Op.iLike]: city } };
    locationInclude.required = true;
  }

  const earnings = `(${durationHours} * "Shift"."hourlyRate" + "Shift"."bonusRate")`;
  let order = [["startTime", "ASC"]];
  if (sort === "date_desc") order = [["startTime", "DESC"]];
  if (sort === "price_desc") order = [[literal(earnings), "DESC"], ["startTime", "ASC"]];
  if (sort === "nearest" && Number.isFinite(latitude) && Number.isFinite(longitude)) {
    const distance = `6371 * acos(least(1, greatest(-1, cos(radians(${latitude})) * cos(radians("Location"."latitude")) * cos(radians("Location"."longitude") - radians(${longitude})) + sin(radians(${latitude})) * sin(radians("Location"."latitude")))))`;
    order = [[literal(distance), "ASC"], ["startTime", "ASC"]];
  }

  console.log("[shiftsService] whereCondition:", whereCondition);

  try {
    // Виконання запиту з підключенням зв'язаних таблиць (Eager Loading)
    const listOptions = {
      where: whereCondition,
      limit: parsedLimit,
      offset: offset,
      order,
      include: [
        { model: Category, attributes: ["id", "name"] },
        { model: JobPosition, attributes: ["id", "title"] },
        locationInclude,
      ],
    };
    const partnerFacetLocation = {
      model: Location,
      attributes: [],
      include: [{ model: Company, attributes: ["id", "name"], required: true }],
    };
    if (city) {
      partnerFacetLocation.where = { city: { [Op.iLike]: city } };
      partnerFacetLocation.required = true;
    }

    const [listResult, partnerRows] = await Promise.all([
      Shift.findAndCountAll(listOptions),
      Shift.findAll({
        attributes: [[fn("COUNT", col("Shift.id")), "count"]],
        where: whereCondition,
        include: [partnerFacetLocation],
        group: ["Location.Company.id", "Location.Company.name"],
        order: [[literal('COUNT("Shift"."id")'), "DESC"], [literal('"Location->Company"."name"'), "ASC"]],
        raw: true,
      }),
    ]);
    const { count, rows } = listResult;
    const partnerOptions = partnerRows
      .map((row) => ({
        label: row["Location.Company.name"],
        count: Number(row.count),
      }))
      .filter((partner) => partner.label);

    console.log(
      `[shiftsService] found ${count} shift(s), returning page ${parsedPage} (${rows.length} row(s))`,
    );

    // Форматування об'єкта результату
    return {
      totalItems: count,
      totalPages: Math.ceil(count / parsedLimit),
      currentPage: parsedPage,
      data: rows,
      partnerOptions,
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

export const findShiftApplication = async (shiftId, workerId) => {
  return await ShiftApplication.findOne({ where: { shiftId, workerId } });
};

export const createShiftApplication = async (shiftId, workerId) => {
  return await ShiftApplication.create({
    shiftId,
    workerId,
    status: "pending",
  });
};

export const cancelWorkerShiftApplication = async (applicationId, workerId) => {
  const application = await ShiftApplication.findOne({
    where: { id: applicationId, workerId },
    include: [{ model: Shift, attributes: ["id", "startTime"] }],
  });

  if (!application) return { application: null, reason: "not_found" };
  if (!["pending", "approved"].includes(application.status)) {
    return { application: null, reason: "status" };
  }
  if (new Date(application.Shift.startTime) <= new Date()) {
    return { application: null, reason: "started" };
  }

  await application.destroy();
  return { application, reason: null };
};

/**
 * Отримує історію робіт (змін) для конкретного робітника.
 */
export const getWorkerShiftHistory = async (
  workerId,
  { page = 1, limit = 10, status, shiftId, scope = "active" },
) => {
  const offset = (page - 1) * limit;
  const whereCondition = { workerId };
  const now = new Date();
  const isArchive = scope === "archive";

  if (isArchive) {
    whereCondition[Op.or] = [
      { status: { [Op.in]: ["rejected", "completed", "no_show"] } },
      where(col("Shift.endTime"), { [Op.lt]: now }),
    ];
  } else {
    whereCondition.status = { [Op.in]: ["pending", "approved"] };
  }

  // Якщо передано статус заявки (наприклад, 'approved' - актуальні, 'completed' - завершені)
  if (status) {
    whereCondition.status = status;
  }
  if (Number.isInteger(shiftId) && shiftId > 0) {
    whereCondition.shiftId = shiftId;
  }

  const { count, rows } = await ShiftApplication.findAndCountAll({
    where: whereCondition,
    limit: limit,
    offset: offset,
    include: [
      {
        model: Shift,
        attributes: ["id", "startTime", "endTime", "hourlyRate", "bonusRate", "description", "status"],
        ...(isArchive ? {} : { where: { endTime: { [Op.gte]: now } }, required: true }),
        include: [
          { model: JobPosition, attributes: ["id", "title"] },
          {
            model: Location,
            attributes: ["id", "title", "address", "city"],
            include: [{ model: Company, attributes: ["id", "name"] }],
          },
        ],
      },
    ],
    order: [
      [Shift, "startTime", isArchive ? "DESC" : "ASC"],
    ],
  });

  return {
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    data: rows,
  };
};

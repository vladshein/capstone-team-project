import { Op, col, fn, literal, where } from "sequelize";
import {
  Shift,
  Location,
  Company,
  JobPosition,
  Category,
  ShiftApplication,
  User,
  WorkerProfile,
  Review,
} from "../db/models/index.js";

const MAP_MARKERS_LIMIT = 1000;

const buildShiftSearchQuery = ({
  minPrice,
  maxPrice,
  categoryId,
  categoryIds,
  partners,
  city,
  dateFrom,
  dateTo,
  durationFilters,
  search,
  sort = "relevance",
  latitude,
  longitude,
  radiusKm,
}) => {
  const whereCondition = {
    status: "open",
    startTime: { [Op.gt]: new Date() },
  };

  if (categoryIds?.length) {
    whereCondition.categoryId = { [Op.in]: categoryIds.map(String) };
  } else if (categoryId) {
    whereCondition.categoryId = String(categoryId);
  }

  if (minPrice !== undefined && maxPrice !== undefined) {
    whereCondition.hourlyRate = { [Op.between]: [minPrice, maxPrice] };
  } else if (minPrice !== undefined) {
    whereCondition.hourlyRate = { [Op.gte]: minPrice };
  } else if (maxPrice !== undefined) {
    whereCondition.hourlyRate = { [Op.lte]: maxPrice };
  }

  if (dateFrom || dateTo) {
    if (dateFrom) whereCondition.startTime[Op.gte] = dateFrom;
    if (dateTo) whereCondition.startTime[Op.lt] = dateTo;
  }

  const durationHours = 'EXTRACT(EPOCH FROM ("Shift"."endTime" - "Shift"."startTime")) / 3600';
  const andConditions = [];
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
  if (durationConditions.length) andConditions.push({ [Op.or]: durationConditions });

  if (search) {
    const searchPattern = `%${search}%`;
    andConditions.push({
      [Op.or]: [
        { description: { [Op.iLike]: searchPattern } },
        { "$JobPosition.title$": { [Op.iLike]: searchPattern } },
      ],
    });
  }

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
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
  const distance = hasCoordinates
    ? `6371 * acos(least(1, greatest(-1, cos(radians(${latitude})) * cos(radians("Location"."latitude")) * cos(radians("Location"."longitude") - radians(${longitude})) + sin(radians(${latitude})) * sin(radians("Location"."latitude")))))`
    : null;

  if (radiusKm && distance) {
    andConditions.push(where(literal(distance), { [Op.lte]: radiusKm }));
  }
  if (andConditions.length) whereCondition[Op.and] = andConditions;

  let order = [["startTime", "ASC"]];
  if (sort === "date_desc") order = [["startTime", "DESC"]];
  if (sort === "price_desc") order = [[literal(earnings), "DESC"], ["startTime", "ASC"]];
  if (sort === "nearest" && distance) {
    order = [[literal(distance), "ASC"], ["startTime", "ASC"]];
  }

  return { whereCondition, locationInclude, order };
};

// Фасетка партнерів враховує решту активних фільтрів (місто, дата, категорії),
// але навмисно не враховує сам фільтр partners. Інакше вимкнений партнер
// зникає з чекліста й користувач уже не може увімкнути його назад.
const buildPartnerFacetLocation = (city) => {
  const locationInclude = {
    model: Location,
    attributes: [],
    include: [{ model: Company, attributes: ["id", "name"], required: true }],
  };
  if (city) {
    locationInclude.where = { city: { [Op.iLike]: city } };
    locationInclude.required = true;
  }
  return locationInclude;
};

const formatPartnerOptions = (partnerRows) =>
  partnerRows
    .map((row) => ({
      label: row["Location.Company.name"],
      count: Number(row.count),
    }))
    .filter((partner) => partner.label);

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
  search,
  sort = "relevance",
  latitude,
  longitude,
  radiusKm,
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
    search,
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

  const { whereCondition, locationInclude, order } = buildShiftSearchQuery({
    minPrice,
    maxPrice,
    categoryId,
    categoryIds,
    partners,
    city,
    dateFrom,
    dateTo,
    durationFilters,
    search,
    sort,
    latitude,
    longitude,
    radiusKm,
  });

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
    const partnerFacetLocation = buildPartnerFacetLocation(city);
    const searchFacetInclude = search
      ? [{ model: JobPosition, attributes: [] }]
      : [];

    const [listResult, partnerRows] = await Promise.all([
      Shift.findAndCountAll(listOptions),
      Shift.findAll({
        attributes: [[fn("COUNT", col("Shift.id")), "count"]],
        where: whereCondition,
        include: [...searchFacetInclude, partnerFacetLocation],
        group: ["Location.Company.id", "Location.Company.name"],
        order: [[literal('COUNT("Shift"."id")'), "DESC"], [literal('"Location->Company"."name"'), "ASC"]],
        raw: true,
      }),
    ]);
    const { count, rows } = listResult;
    const partnerOptions = formatPartnerOptions(partnerRows);

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

/** Повертає лише поля, потрібні для маркерів карти, без пагінації карток. */
export const getShiftMapMarkers = async (filters) => {
  const { whereCondition, locationInclude, order } = buildShiftSearchQuery(filters);
  const partnerFacetLocation = buildPartnerFacetLocation(filters.city);
  const searchFacetInclude = filters.search
    ? [{ model: JobPosition, attributes: [] }]
    : [];

  const [rows, partnerRows] = await Promise.all([
    Shift.findAll({
      attributes: ["id", "startTime", "endTime", "hourlyRate", "bonusRate"],
      where: whereCondition,
      order,
      limit: MAP_MARKERS_LIMIT + 1,
      include: [
        { model: JobPosition, attributes: ["title"] },
        locationInclude,
      ],
    }),
    Shift.findAll({
      attributes: [[fn("COUNT", col("Shift.id")), "count"]],
      where: whereCondition,
      include: [...searchFacetInclude, partnerFacetLocation],
      group: ["Location.Company.id", "Location.Company.name"],
      order: [[literal('COUNT("Shift"."id")'), "DESC"], [literal('"Location->Company"."name"'), "ASC"]],
      raw: true,
    }),
  ]);

  return {
    data: rows.slice(0, MAP_MARKERS_LIMIT),
    isTruncated: rows.length > MAP_MARKERS_LIMIT,
    partnerOptions: formatPartnerOptions(partnerRows),
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

/** Повертає зміни однієї компанії лише її власнику. */
export const getBusinessShifts = async ({ companyId, ownerId, scope, page = 1, limit = 8 }) => {
  const company = await Company.findOne({ where: { id: companyId, ownerId } });

  if (!company) {
    const error = new Error("У вас немає доступу до змін цієї компанії");
    error.status = 403;
    throw error;
  }

  const now = new Date();
  const shiftWhere =
    scope === "archive"
      ? {
          [Op.or]: [
            { status: { [Op.in]: ["completed", "cancelled"] } },
            { endTime: { [Op.lt]: now } },
          ],
        }
      : {
          status: { [Op.in]: ["open", "booked", "in_progress"] },
          endTime: { [Op.gte]: now },
        };

  const archiveIncludes = scope === "archive"
    ? [
        {
          model: ShiftApplication,
          attributes: ["id", "workerId", "status"],
          where: { status: { [Op.in]: ["completed", "no_show"] } },
          required: false,
          include: [
            {
              model: User,
              attributes: ["id"],
              include: [{
                model: WorkerProfile,
                attributes: ["firstName", "lastName"],
              }],
            },
          ],
        },
        {
          // В архіві бізнес бачить лише власний відгук, щоб його редагувати.
          model: Review,
          attributes: ["id", "rating", "comment"],
          where: { reviewerId: ownerId },
          required: false,
        },
      ]
    : [];

  const { count, rows } = await Shift.findAndCountAll({
    where: shiftWhere,
    limit,
    offset: (page - 1) * limit,
    // Архів додає hasMany заявки та reviews, тому рахуємо саме зміни.
    distinct: true,
    subQuery: false,
    include: [
      { model: JobPosition, attributes: ["id", "title"] },
      { model: Category, attributes: ["id", "name"] },
      {
        model: Location,
        attributes: ["id", "title", "city", "address"],
        where: { companyId: company.id },
        required: true,
      },
      ...archiveIncludes,
    ],
    order: [["startTime", scope === "archive" ? "DESC" : "ASC"]],
  });

  return {
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    data: rows,
  };
};

/** Повертає нові й підтверджені заявки конкретної компанії лише її власнику. */
export const getBusinessShiftApplications = async ({ companyId, ownerId, page = 1, limit = 8 }) => {
  const company = await Company.findOne({ where: { id: companyId, ownerId } });

  if (!company) {
    const error = new Error("У вас немає доступу до заявок цієї компанії");
    error.status = 403;
    throw error;
  }

  const { count, rows } = await ShiftApplication.findAndCountAll({
    where: { status: { [Op.in]: ["pending", "approved"] } },
    // `Reviews` — hasMany. За стандартного `subQuery: true` Sequelize виносить
    // Shift у підзапит, а JobPosition приєднує зовні, де alias Shift уже
    // недоступний. Це давало SQL-помилку `Shift.positionId does not exist`.
    subQuery: false,
    include: [
      {
        model: Shift,
        attributes: ["id", "startTime", "endTime", "status"],
        required: true,
        include: [
          { model: JobPosition, attributes: ["id", "title"] },
          // Повертаємо тільки відгук поточного власника компанії. Відгук
          // виконавця не потрібен для керування заявками бізнесу.
          {
            model: Review,
            attributes: ["id", "rating", "comment"],
            where: { reviewerId: ownerId },
            required: false,
          },
          {
            model: Location,
            attributes: ["id", "title", "city", "address"],
            where: { companyId: company.id },
            required: true,
          },
        ],
      },
      {
        model: User,
        attributes: ["id", "phone", "avatar"],
        include: [
          {
            model: WorkerProfile,
            attributes: ["firstName", "lastName", "rating", "avatarUrl"],
          },
        ],
      },
    ],
    order: [["appliedAt", "DESC"]],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
    subQuery: false,
  });

  return {
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    data: rows,
  };
};

/** Дані виконавця для архівної зміни — доступні лише власнику компанії. */
export const getBusinessShiftWorkerSummary = async ({ shiftId, ownerId }) => {
  const application = await ShiftApplication.findOne({
    where: { shiftId, status: { [Op.in]: ["completed", "no_show"] } },
    include: [
      {
        model: Shift,
        required: true,
        attributes: ["id"],
        include: [{
          model: Location,
          required: true,
          attributes: ["id"],
          include: [{ model: Company, attributes: ["id"], where: { ownerId }, required: true }],
        }],
      },
      {
        model: User,
        attributes: ["id", "avatar"],
        include: [{ model: WorkerProfile, attributes: ["firstName", "lastName", "rating", "avatarUrl"] }],
      },
    ],
  });

  if (!application) return null;
  const review = await Review.findOne({
    where: { shiftId, reviewerId: ownerId },
    attributes: ["id", "rating", "comment"],
  });

  return { application, review };
};

/** Повертає тільки кількість нових заявок, без важких даних виконавців і змін. */
export const getPendingBusinessShiftApplicationsCount = async ({ companyId, ownerId }) => {
  const company = await Company.findOne({ where: { id: companyId, ownerId } });

  if (!company) {
    const error = new Error("У вас немає доступу до заявок цієї компанії");
    error.status = 403;
    throw error;
  }

  return ShiftApplication.count({
    where: { status: "pending" },
    include: [
      {
        model: Shift,
        required: true,
        include: [
          {
            model: Location,
            where: { companyId: company.id },
            required: true,
          },
        ],
      },
    ],
  });
};

/** Приймає або відхиляє заявку на зміну від імені власника компанії. */
export const decideBusinessShiftApplication = async ({ applicationId, ownerId, decision }) => {
  return Shift.sequelize.transaction(async (transaction) => {
    const application = await ShiftApplication.findByPk(applicationId, {
      include: [
        {
          model: Shift,
          required: true,
          include: [{
            model: Location,
            required: true,
            include: [{ model: Company, required: true }],
          }],
        },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!application) return { application: null, reason: "not_found" };
    if (application.Shift.Location.Company.ownerId !== ownerId) {
      return { application: null, reason: "forbidden" };
    }
    if (application.status !== "pending") {
      return { application: null, reason: "status" };
    }
    if (application.Shift.status !== "open" || new Date(application.Shift.startTime) <= new Date()) {
      return { application: null, reason: "unavailable" };
    }

    if (decision === "approved") {
      await application.update({ status: "approved" }, { transaction });
      await application.Shift.update({ status: "booked" }, { transaction });
      // Одна зміна — один виконавець: інші нерозглянуті заявки закриваємо.
      await ShiftApplication.update(
        { status: "rejected" },
        {
          where: { shiftId: application.shiftId, status: "pending", id: { [Op.ne]: application.id } },
          transaction,
        },
      );
    } else {
      await application.update({ status: "rejected" }, { transaction });
    }

    return { application, reason: null };
  });
};

/** Підтверджує виконання зміни її власником після завершення робочого часу. */
export const completeBusinessShiftApplication = async ({ applicationId, ownerId }) => {
  return Shift.sequelize.transaction(async (transaction) => {
    const application = await ShiftApplication.findByPk(applicationId, {
      include: [
        {
          model: Shift,
          required: true,
          include: [{
            model: Location,
            required: true,
            include: [{ model: Company, required: true }],
          }],
        },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!application) return { application: null, reason: "not_found" };
    if (application.Shift.Location.Company.ownerId !== ownerId) {
      return { application: null, reason: "forbidden" };
    }
    if (application.status !== "approved" || application.Shift.status !== "booked") {
      return { application: null, reason: "status" };
    }
    if (new Date(application.Shift.endTime) > new Date()) {
      return { application: null, reason: "not_finished" };
    }

    await application.update({ status: "completed" }, { transaction });
    await application.Shift.update({ status: "completed" }, { transaction });
    return { application, reason: null };
  });
};

/** Позначає підтвердженого виконавця як такого, що не з'явився на зміну. */
export const markBusinessShiftApplicationNoShow = async ({ applicationId, ownerId }) => {
  return Shift.sequelize.transaction(async (transaction) => {
    const application = await ShiftApplication.findByPk(applicationId, {
      include: [{
        model: Shift,
        required: true,
        include: [{
          model: Location,
          required: true,
          include: [{ model: Company, required: true }],
        }],
      }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!application) return { application: null, reason: "not_found" };
    if (application.Shift.Location.Company.ownerId !== ownerId) {
      return { application: null, reason: "forbidden" };
    }
    if (application.status !== "approved" || application.Shift.status !== "booked") {
      return { application: null, reason: "status" };
    }
    if (new Date(application.Shift.endTime) > new Date()) {
      return { application: null, reason: "not_finished" };
    }

    await application.update({ status: "no_show" }, { transaction });
    // У Shift.status поки немає no_show, тому закриваємо зміну як фінальну.
    await application.Shift.update({ status: "completed" }, { transaction });
    return { application, reason: null };
  });
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
  await Shift.sequelize.transaction(async (transaction) => {
    await shift.update({ status: "cancelled" }, { transaction });
    await ShiftApplication.update(
      { status: "rejected" },
      {
        where: {
          shiftId,
          status: { [Op.in]: ["pending", "approved"] },
        },
        transaction,
      },
    );
  });
  return shift;
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
  // Після підтвердження компанією зміна вже заброньована за виконавцем,
  // тому відкликати можна лише заявку, яка ще перебуває на розгляді.
  if (application.status !== "pending") {
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
  const isCompleted = scope === "completed";
  const isArchive = scope === "archive";

  if (isCompleted) {
    whereCondition.status = "completed";
  } else if (isArchive) {
    whereCondition[Op.or] = [
      { status: { [Op.in]: ["rejected", "no_show"] } },
      {
        status: { [Op.in]: ["pending", "approved"] },
        // Shift ще не приєднаний у WHERE цього запиту, тому перевіряємо
        // завершення через підзапит за id. Інакше PostgreSQL не бачить alias Shift.
        shiftId: {
          [Op.in]: literal(`(SELECT "id" FROM "shifts" WHERE "endTime" < '${now.toISOString()}')`),
        },
      },
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
    // Пагінація з belongsTo-join не потребує підзапиту; так alias Shift
    // лишається доступним і для сортування, і для умов архіву.
    subQuery: false,
    include: [
      {
        model: Shift,
        attributes: ["id", "startTime", "endTime", "hourlyRate", "bonusRate", "description", "status"],
        ...(isCompleted || isArchive ? {} : { where: { endTime: { [Op.gte]: now } }, required: true }),
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
      [Shift, "startTime", isCompleted || isArchive ? "DESC" : "ASC"],
    ],
  });

  // Не додаємо hasMany Review у головний paginated query: Sequelize через це
  // генерує крихкі підзапити. Натомість одним запитом беремо відгуки тільки
  // для змін поточної сторінки й додаємо дані лише власного відгуку.
  const shiftIds = rows.map((application) => application.Shift?.id).filter(Boolean);
  if (shiftIds.length > 0) {
    const reviews = await Review.findAll({
      attributes: ["id", "shiftId", "rating", "comment"],
      where: { reviewerId: workerId, shiftId: { [Op.in]: shiftIds } },
      raw: true,
    });
    const reviewIdsByShift = new Map();
    reviews.forEach((review) => {
      const ids = reviewIdsByShift.get(review.shiftId) ?? [];
      ids.push({ id: review.id, rating: review.rating, comment: review.comment });
      reviewIdsByShift.set(review.shiftId, ids);
    });
    rows.forEach((application) => {
      application.Shift?.setDataValue("Reviews", reviewIdsByShift.get(application.Shift.id) ?? []);
    });
  }

  return {
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    data: rows,
  };
};

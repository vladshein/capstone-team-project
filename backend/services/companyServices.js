import { Company, Location, User, Shift, JobPosition, Category, Review } from "../db/models/index.js";
import { Op } from "sequelize";

/**
 * Отримує компанію за ID разом з локаціями.
 * Публічний метод (без перевірки власника) — для MVP.
 */
export const getCompanyById = async (companyId, { includePhone = false } = {}) => {
  const company = await Company.findByPk(companyId, {
    // Публічна сторінка не повинна віддавати службові чи фінансові дані.
    attributes: ["id", "ownerId", "name", "description", "avatar", "created_at"],
    include: [
      ...(includePhone ? [{ model: User, as: "Owner", attributes: ["phone"] }] : []),
      {
        model: Location,
        attributes: ["id", "title", "city", "address", "latitude", "longitude"],
      },
    ],
  });

  if (!company) {
    const error = new Error("Компанію не знайдено");
    error.status = 404;
    throw error;
  }

  const ratingResult = await Review.findOne({
    where: { revieweeId: company.ownerId },
    attributes: [[Review.sequelize.fn("AVG", Review.sequelize.col("rating")), "averageRating"]],
    include: [{
      model: Shift,
      attributes: [],
      required: true,
      include: [{
        model: Location,
        attributes: [],
        required: true,
        include: [{ model: Company, attributes: [], where: { id: company.id }, required: true }],
      }],
    }],
    raw: true,
  });
  const averageRating = Number(ratingResult?.averageRating);
  company.setDataValue(
    "rating",
    Number.isFinite(averageRating) ? Math.round(averageRating * 100) / 100 : 0,
  );

  return company;
};

/** Повертає актуальні публічні дані кількох компаній одним HTTP-запитом. */
export const getPublicCompaniesByIds = async (companyIds) => {
  const uniqueIds = [...new Set(companyIds)];
  return Promise.all(uniqueIds.map((companyId) => getCompanyById(companyId)));
};

/**
 * Повертає лише доступні для відгуку зміни конкретної компанії.
 * Не використовуємо загальний пошук за назвою партнера: назви компаній
 * можуть повторюватися, тому фільтруємо за надійним companyId локації.
 */
export const getPublicCompanyOpenShifts = async (companyId, { page = 1, limit = 6 } = {}) => {
  const company = await Company.findByPk(companyId, { attributes: ["id"] });

  if (!company) {
    const error = new Error("Компанію не знайдено");
    error.status = 404;
    throw error;
  }

  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 6, 1), 12);
  const { count, rows } = await Shift.findAndCountAll({
    where: {
      status: "open",
      startTime: { [Op.gt]: new Date() },
    },
    include: [
      { model: Category, attributes: ["id", "name"] },
      { model: JobPosition, attributes: ["id", "title"] },
      {
        model: Location,
        attributes: ["id", "title", "city", "address"],
        where: { companyId: company.id },
        required: true,
      },
    ],
    order: [["startTime", "ASC"]],
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  });

  return {
    totalItems: count,
    totalPages: Math.ceil(count / safeLimit),
    currentPage: safePage,
    data: rows,
  };
};

/**
 * Отримує всі компанії, які належать конкретному користувачу (власнику).
 * Повертає список разом з їхніми локаціями для кабінету бізнесу.
 */
export const getUserCompanies = async (ownerId) => {
  return await Company.findAll({
    where: { ownerId },
    include: [
      {
        model: Location,
        attributes: ["id", "title", "city", "address", "latitude", "longitude"],
      },
    ],
    order: [["created_at", "DESC"]],
  });
};

/**
 * Створює нову компанію та прив'язує її до користувача
 */
export const createCompany = async (ownerId, companyData) => {
  // Перевірка унікальності ЄДРПОУ в усій базі
  const existingCompany = await Company.findOne({
    where: { edrpou: companyData.edrpou },
  });
  if (existingCompany) {
    const error = new Error(
      "Компанія з таким ЄДРПОУ вже зареєстрована в системі",
    );
    error.status = 409;
    throw error;
  }

  return await Company.create({
    ownerId,
    ...companyData,
  });
};

/** Створює робочу точку лише для компанії поточного бізнес-користувача. */
export const createCompanyLocation = async (companyId, ownerId, locationData) => {
  const company = await Company.findOne({ where: { id: companyId, ownerId } });

  if (!company) {
    const error = new Error("У вас немає прав додавати локації цій компанії");
    error.status = 403;
    throw error;
  }

  return Location.create({ companyId: company.id, ...locationData });
};

/**
 * Оновлює дані компанії. Перевіряє, чи належить вона користувачу.
 */
export const updateCompany = async (companyId, ownerId, updateData) => {
  const company = await Company.findByPk(companyId);

  if (!company) {
    const error = new Error("Компанію не знайдено");
    error.status = 404;
    throw error;
  }

  // Перевірка прав власності
  if (company.ownerId !== ownerId) {
    const error = new Error("У вас немає прав на редагування цієї компанії");
    error.status = 403;
    throw error;
  }

  // Перевірка ЄДРПОУ при спробі його змінити
  if (updateData.edrpou && updateData.edrpou !== company.edrpou) {
    const existingCompany = await Company.findOne({
      where: { edrpou: updateData.edrpou },
    });
    if (existingCompany) {
      const error = new Error(
        "Цей ЄДРПОУ вже використовується іншою компанією",
      );
      error.status = 409;
      throw error;
    }
  }

  return await company.update(updateData);
};

/**
 * Видаляє компанію (та каскадно всі її локації та зміни).
 * Перевіряє права власності.
 */
export const deleteCompany = async (companyId, ownerId) => {
  const company = await Company.findByPk(companyId);

  if (!company) {
    const error = new Error("Компанію не знайдено");
    error.status = 404;
    throw error;
  }

  // Перевірка прав власності
  if (company.ownerId !== ownerId) {
    const error = new Error("У вас немає прав на видалення цієї компанії");
    error.status = 403;
    throw error;
  }

  // Видаляємо компанію. Завдяки onDelete: 'CASCADE' в моделях,
  // Postgres автоматично видалить всі пов'язані Locations, Shifts, Reviews тощо.
  await company.destroy();

  return { success: true };
};

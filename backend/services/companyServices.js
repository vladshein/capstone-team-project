import { Company, Location, User } from "../db/models/index.js";

/**
 * Отримує компанію за ID разом з локаціями.
 * Публічний метод (без перевірки власника) — для MVP.
 */
export const getCompanyById = async (companyId) => {
  const company = await Company.findByPk(companyId, {
    // Публічна сторінка не повинна віддавати службові чи фінансові дані.
    attributes: ["id", "ownerId", "name", "description", "avatar", "created_at"],
    include: [
      {
        model: User,
        as: "Owner",
        attributes: ["phone"],
      },
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

  return company;
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

import * as companyService from "../services/companyServices.js";

export const getCompanyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const company = await companyService.getCompanyById(id, {
      includePhone: Boolean(req.user),
    });

    res.status(200).json({
      message: "Компанію успішно отримано",
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

/** Показує актуальні відкриті зміни на публічному профілі компанії. */
export const getPublicCompanyOpenShifts = async (req, res, next) => {
  try {
    const companyId = Number(req.params.id);
    if (!Number.isInteger(companyId) || companyId < 1) {
      const error = new Error("Некоректний ідентифікатор компанії.");
      error.status = 400;
      throw error;
    }

    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 6, 1), 12);
    const shifts = await companyService.getPublicCompanyOpenShifts(companyId, { page, limit });

    res.status(200).json({ data: shifts });
  } catch (error) {
    next(error);
  }
};

export const getPublicCompaniesByIds = async (req, res, next) => {
  try {
    const companyIds = String(req.query.ids ?? "")
      .split(",")
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0)
      .slice(0, 12);

    if (companyIds.length === 0) {
      const error = new Error("Передайте хоча б один коректний ідентифікатор компанії.");
      error.status = 400;
      throw error;
    }

    const companies = await companyService.getPublicCompaniesByIds(companyIds);
    res.status(200).json({ data: companies });
  } catch (error) {
    next(error);
  }
};

export const getMyCompanies = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const companies = await companyService.getUserCompanies(ownerId);

    res.status(200).json({
      message: "Компанії успішно отримано",
      data: companies, // Поверне масив компаній (навіть якщо він порожній)
    });
  } catch (error) {
    next(error);
  }
};

export const createCompany = async (req, res, next) => {
  try {
    const ownerId = req.user.id;

    // Перевіряємо роль
    if (req.user.role !== "business_client") {
      const error = new Error(
        "Тільки бізнес-клієнти можуть створювати компанії",
      );
      error.status = 403;
      throw error;
    }

    const newCompany = await companyService.createCompany(ownerId, req.body);

    res.status(201).json({
      message: "Компанію успішно додано",
      data: newCompany,
    });
  } catch (error) {
    next(error);
  }
};

export const createCompanyLocation = async (req, res, next) => {
  try {
    const location = await companyService.createCompanyLocation(
      Number(req.params.id),
      req.user.id,
      req.body,
    );

    res.status(201).json({
      message: "Робочу локацію успішно додано",
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCompany = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const companyId = req.params.id; // Беремо ID компанії з URL

    const updatedCompany = await companyService.updateCompany(
      companyId,
      ownerId,
      req.body,
    );

    res.status(200).json({
      message: "Дані компанії успішно оновлено",
      data: updatedCompany,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCompany = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const companyId = req.params.id; // Беремо ID компанії з URL

    await companyService.deleteCompany(companyId, ownerId);

    res.status(200).json({
      message: "Компанію та всі пов'язані з нею дані успішно видалено",
    });
  } catch (error) {
    next(error);
  }
};

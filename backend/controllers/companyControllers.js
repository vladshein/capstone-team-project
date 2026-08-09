import * as companyService from "../services/companyServices.js";

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

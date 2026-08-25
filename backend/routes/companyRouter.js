import express from "express";
import validateBody from "../helpers/validateBody.js";
import authenticate from "../middlewares/authenticate.js";
import optionalAuthenticate from "../middlewares/optionalAuthenticate.js";
import {
  createCompanySchema,
  createCompanyLocationSchema,
  updateCompanySchema,
} from "../schemas/companySchemas.js";

import checkRole from "../middlewares/checkRole.js";
import * as companyController from "../controllers/companyControllers.js";
import * as businessStatisticsController from "../controllers/businessStatisticsControllers.js";
const companyRouter = express.Router();

// Має бути перед /public/:id, щоб "shifts" не стало значенням :id.
companyRouter.get(
  "/public/:id/shifts",
  optionalAuthenticate,
  companyController.getPublicCompanyOpenShifts,
);

// Окремий шлях не конфліктує з /my та не вимагає сесії.
companyRouter.get("/public/:id", optionalAuthenticate, companyController.getCompanyById);

// Всі ці маршрути вимагають авторизації
companyRouter.use(authenticate);

// Отримати список своїх компаній (для кабінету)
companyRouter.get("/my", companyController.getMyCompanies);

// Статистика власника: одна компанія (companyId) або всі його компанії.
// Має стояти перед /:id, інакше 'me' сприйметься як значення параметра id.
companyRouter.get(
  "/me/statistics/summary",
  checkRole("business_client"),
  businessStatisticsController.getStatisticsSummary,
);
companyRouter.get(
  "/me/statistics/shifts",
  checkRole("business_client"),
  businessStatisticsController.getShiftsStatistics,
);
companyRouter.get(
  "/me/statistics/workers",
  checkRole("business_client"),
  businessStatisticsController.getWorkersStatistics,
);

// Публічний — доступний гостям (для картки компанії на сторінці зміни)
companyRouter.get("/:id", companyController.getCompanyById);

// Додати нову компанію до свого акаунту
companyRouter.post(
  "/",
  validateBody(createCompanySchema),
  companyController.createCompany,
);

// Робочі точки відрізняються від юридичної адреси компанії.
companyRouter.post(
  "/:id/locations",
  validateBody(createCompanyLocationSchema),
  companyController.createCompanyLocation,
);

// Редагувати конкретну компанію за її ID
companyRouter.patch(
  "/:id",
  validateBody(updateCompanySchema),
  companyController.updateCompany,
);

// Видалити конкретну компанію за її ID
companyRouter.delete("/:id", companyController.deleteCompany);

export default companyRouter;

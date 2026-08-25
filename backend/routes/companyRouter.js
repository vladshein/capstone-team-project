import express from "express";
import validateBody from "../helpers/validateBody.js";
import authenticate from "../middlewares/authenticate.js";
import optionalAuthenticate from "../middlewares/optionalAuthenticate.js";
import {
  createCompanySchema,
  createCompanyLocationSchema,
  updateCompanySchema,
} from "../schemas/companySchemas.js";

import * as companyController from "../controllers/companyControllers.js";
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

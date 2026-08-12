import express from "express";
import validateBody from "../helpers/validateBody.js";
import authenticate from "../middlewares/authenticate.js";
import {
  createCompanySchema,
  updateCompanySchema,
} from "../schemas/companySchemas.js";

import * as companyController from "../controllers/companyControllers.js";
const companyRouter = express.Router();

// Публічний — доступний гостям (для картки компанії на сторінці зміни)
companyRouter.get("/:id", companyController.getCompanyById);

// Всі ці маршрути вимагають авторизації
companyRouter.use(authenticate);

// Отримати список своїх компаній (для кабінету)
companyRouter.get("/my", companyController.getMyCompanies);

// Додати нову компанію до свого акаунту
companyRouter.post(
  "/",
  validateBody(createCompanySchema),
  companyController.createCompany,
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

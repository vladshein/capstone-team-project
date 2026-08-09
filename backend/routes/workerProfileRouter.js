import express from "express";
import validateBody from "../helpers/validateBody.js";
import authenticate from "../middlewares/authenticate.js";

import {
  createProfileSchema,
  updateProfileSchema,
} from "../schemas/workerProfileSchemas.js";

import * as workerProfileController from "../controllers/workerProfileControllers.js";

const workerProfileRouter = express.Router();

// Всі ці маршрути вимагають авторизації
workerProfileRouter.use(authenticate);

// Отримати свій профіль (для кабінету)
workerProfileRouter.get("/me", workerProfileController.getMyProfile);

// Створити профіль (одразу після реєстрації)
workerProfileRouter.post(
  "/",
  validateBody(createProfileSchema),
  workerProfileController.createMyProfile,
);

// Редагувати свій профіль
workerProfileRouter.patch(
  "/me",
  validateBody(updateProfileSchema),
  workerProfileController.updateMyProfile,
);

export default workerProfileRouter;

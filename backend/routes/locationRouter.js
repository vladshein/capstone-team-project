import express from "express";

import {
  getApproximateLocationByIp,
  getCityByCoordinatesController,
} from "../controllers/locationControllers.js";

const locationRouter = express.Router();

locationRouter.get("/approx", getApproximateLocationByIp);
locationRouter.get("/reverse", getCityByCoordinatesController);

export default locationRouter;

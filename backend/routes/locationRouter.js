import express from "express";

import { getApproximateLocationByIp } from "../controllers/locationControllers.js";

const locationRouter = express.Router();

locationRouter.get("/approx", getApproximateLocationByIp);

export default locationRouter;

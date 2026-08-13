import express from "express";

import {
  categoriesController,
  areasController,
  jobPositionsController,
} from "../controllers/commonControllers.js";

const commonRouter = express.Router();

commonRouter.get("/categories", categoriesController);
commonRouter.get("/areas", areasController);
commonRouter.get("/positions", jobPositionsController);

export default commonRouter;

import express from "express";

import {
  categoriesController,
  areasController,
} from "../controllers/commonControllers.js";

const commonRouter = express.Router();

commonRouter.get("/categories", categoriesController);
commonRouter.get("/areas", areasController);

export default commonRouter;

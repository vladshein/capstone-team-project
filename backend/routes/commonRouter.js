import express from "express";

import {
    categoriesController,
    areasController,
    ingredientsController,
    testimonialsController,
} from "../controllers/commonControllers.js";

const commonRouter = express.Router();

commonRouter.get("/categories", categoriesController);
commonRouter.get("/areas", areasController);
commonRouter.get("/ingredients", ingredientsController);
commonRouter.get("/testimonials", testimonialsController);

export default commonRouter;

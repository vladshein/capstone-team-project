import express from "express";
import validateBody from "../helpers/validateBody.js";
import upload from "../middlewares/upload.js";

import { registerSchema, loginSchema } from "../schemas/authSchemas.js";
import {
  registerController,
  loginController,
  refreshController,
  logoutController,
  // updateAvatarController,
} from "../controllers/authControllers.js";
import authenticate from "../middlewares/authenticate.js";

const authRouter = express.Router();

/**
 * @swagger
 * {
 *   "/api/auth/register": {
 *     "post": {
 *       "tags": ["Auth"],
 *       "summary": "Public user registration endpoint",
 *       "requestBody": {
 *         "required": true,
 *         "content": {
 *           "application/json": {
 *             "schema": { "$ref": "#/components/schemas/RegisterRequest" }
 *           }
 *         }
 *       },
 *       "responses": {
 *         "201": { "$ref": "#/components/responses/201AuthSuccess" },
 *         "400": { "$ref": "#/components/responses/400ValidationError" }
 *       }
 *     }
 *   }
 * }
 */
authRouter.post("/register", validateBody(registerSchema), registerController);


authRouter.post("/login", validateBody(loginSchema), loginController);
authRouter.get("/refresh", authenticate, refreshController);
authRouter.get("/logout", authenticate, logoutController);

// authRouter.patch("/avatars", authenticate, upload.single("avatar"), updateAvatarController);

export default authRouter;

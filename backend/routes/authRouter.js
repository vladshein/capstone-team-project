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
 *       "operationId": "authRegister",
 *       "security": [],
 *       "description": "## Register New User\n### Request\nThis endpoint provisions a new account in the system and automatically generates initial application credentials.\n\n#### Expected Request Fields:\n - **email** (string, required) — Unique email address used as the primary login identifier.\n - **password** (string, required) — Account password. Must be at least 8 characters long, containing numbers and special symbols.\n - **phone** (string, optional) — Contact telephone formatted in international E.164 standard.\n - **role** (string, optional) — Assigned user system role. Defaults to `worker` if omitted. Allowed options: `worker`, `company`.\n\n#### Security & Access:\n - No authorization headers required to hit this endpoint.\n - On success, returns an authentication payload including profile metrics and active context tokens.\n ### Response\n - **user** (object) — User data.\n   - **id** (integer) — User ID.\n   - **email** (string) — Contact email address.\n   - **role** (string) — Assigned user system role. Defaults to `worker` if omitted. Allowed options: `worker`, `company`.\n   - **displayName** (string) — Display user name.\n   - **avatarUrl** (string) — link on avatart username.\n   - **balance** (integer) — Financial user balance.\n   - **phone** (string) — User phone number.\n   - **isVerified** (bool) — flag, is user verified.\n - **accessToken** (string) — valid JWT token.",
 *       "requestBody": {
 *         "required": true,
 *         "content": {
 *           "application/json": {
 *             "schema": { "$ref": "#/components/schemas/RegisterRequest" }
 *           }
 *         }
 *       },
 *       "responses": {
 *         "201": { "$ref": "#/components/responses/201RegisterAccountSuccess" },
 *         "400": { "$ref": "#/components/responses/400ValidationError" }
 *       }
 *     }
 *   }
 * }
 */
authRouter.post("/register", validateBody(registerSchema), registerController);



/**
 * @swagger
 * {
 *   "/api/auth/login": {
 *     "post": {
 *       "tags": ["Auth"],
 *       "summary": "Public user login endpoint",
 *       "operationId": "authLogin",
 *       "security": [],
 *       "description": "## Login User\n### Request\nThis endpoint provisions access to system and automatically generates initial application credentials.\n\n#### Expected Request Fields:\n - **email** (string, required) — Unique email address used as the primary login identifier.\n - **password** (string, required) — Account password. Must be at least 8 characters long, containing numbers and special symbols.\n\n#### Security & Access:\n - No authorization headers required to hit this endpoint.\n - On success, returns an authentication payload including active context tokens.\n ### Response\n - **user** (object) — User data.\n   - **id** (integer) — User ID.\n   - **email** (string) — Contact email address.\n   - **role** (string) — Assigned user system role. Defaults to `worker` if omitted. Allowed options: `worker`, `company`.\n   - **displayName** (string) — Display user name.\n   - **avatarUrl** (string) — link on avatart username.\n   - **balance** (integer) — Financial user balance.\n   - **phone** (string) — User phone number.\n   - **isVerified** (bool) — flag, is user verified.\n - **accessToken** (string) — valid JWT token.",
 *       "requestBody": {
 *         "required": true,
 *         "content": {
 *           "application/json": {
 *             "schema": { "$ref": "#/components/schemas/LoginRequest" }
 *           }
 *         }
 *       },
 *       "responses": {
 *         "200": { "$ref": "#/components/responses/200LoginSuccess" },
 *         "400": { "$ref": "#/components/responses/400ValidationError" }
 *       }
 *     }
 *   }
 * }
 */
authRouter.post("/login", validateBody(loginSchema), loginController);


/**
 * @swagger
 * {
 *   "/api/auth/refresh": {
 *     "post": {
 *       "tags": ["Auth"],
 *       "summary": "Refresh access token using refresh token cookie",
 *       "operationId": "authRefresh",
 *       "security": [],
 *       "description": "## Refresh JWT Token\n### Request\nGenerates a new access token using the refresh token stored in an httpOnly cookie (`refreshToken`, sent automatically by the browser). No request body or Authorization header is required — the cookie is set by `/login` or `/register` and scoped to `/api/auth`.\n\n### Response\n - **user** (object) — User data.\n   - **id** (integer) — User ID.\n   - **email** (string) — Contact email address.\n   - **role** (string) — Assigned user system role. Allowed options: `worker`, `company`.\n   - **displayName** (string) — Display user name.\n   - **avatarUrl** (string) — link on avatar.\n   - **balance** (integer) — Financial user balance.\n   - **phone** (string) — User phone number.\n   - **isVerified** (bool) — flag, is user verified.\n - **accessToken** (string) — new valid JWT access token.\n\nOn success, a new `refreshToken` cookie is also set (token rotation).",
 *       "responses": {
 *         "200": { "$ref": "#/components/responses/200LoginSuccess" },
 *         "401": { "description": "Missing, invalid or expired refresh token" }
 *       }
 *     }
 *   }
 * }
 */
authRouter.post("/refresh", refreshController);


/**
 * @swagger
 * {
 *   "/api/auth/logout": {
 *     "post": {
 *       "tags": ["Auth"],
 *       "summary": "Private user logout endpoint",
 *       "operationId": "authLogout",
 *       "security": [
 *         {
 *           "bearerAuth": []
 *         }
 *       ],
 *       "description": "## Logout User\n### Request\nThis endpoint logout user from systems.\n\n#### Expected Request Fields:\n - only JWT in barer header\n ### Response\n - no value",
 *       "responses": {
 *         "204": { "$ref": "#/components/responses/204NoContent" },
 *       }
 *     }
 *   }
 * }
 */
authRouter.post("/logout", authenticate, logoutController);

// authRouter.patch("/avatars", authenticate, upload.single("avatar"), updateAvatarController);

export default authRouter;

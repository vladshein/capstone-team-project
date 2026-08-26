import { jest } from "@jest/globals";
import express from "express";
import request from "supertest";

import errorHandler from "../middlewares/errorHandler.js";

let isAuthenticated = true;
const authenticate = jest.fn((req, res, next) => {
  if (!isAuthenticated) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  req.user = { id: 7, role: "worker" };
  next();
});
const registerRateLimit = jest.fn((_req, _res, next) => next());
const loginRateLimit = jest.fn((_req, _res, next) => next());
const forgotPasswordRateLimit = jest.fn((_req, _res, next) => next());
const resetPasswordRateLimit = jest.fn((_req, _res, next) => next());
const resendVerificationRateLimit = jest.fn((_req, _res, next) => next());
const forgotPasswordController = jest.fn((_req, res) =>
  res.status(202).json({
    message: "Якщо акаунт з такою email-адресою існує, ми надіслали інструкції для відновлення пароля.",
  }),
);
const resetPasswordController = jest.fn((_req, res) =>
  res.status(200).json({ message: "Пароль успішно оновлено. Тепер увійдіть з новим паролем." }),
);
const verifyEmailController = jest.fn((_req, res) =>
  res.status(200).json({ message: "Email успішно підтверджено.", userId: 7 }),
);
const resendEmailVerificationController = jest.fn((_req, res) =>
  res.status(202).json({ message: "Лист для підтвердження надіслано повторно." }),
);

jest.unstable_mockModule("../middlewares/authenticate.js", () => ({
  default: authenticate,
}));
jest.unstable_mockModule("../controllers/authControllers.js", () => ({
  registerController: jest.fn(),
  loginController: jest.fn(),
  refreshController: jest.fn(),
  logoutController: jest.fn(),
  forgotPasswordController,
  resetPasswordController,
  verifyEmailController,
  resendEmailVerificationController,
}));
// Логіку rate limit перевіряє окремий тест. Тут перевіряємо лише порядок
// middleware та з'єднання маршруту з контролером.
jest.unstable_mockModule("../middlewares/authRateLimit.js", () => ({
  registerRateLimit,
  loginRateLimit,
  forgotPasswordRateLimit,
  resetPasswordRateLimit,
  resendVerificationRateLimit,
}));

const { default: authRouter } = await import("../routes/authRouter.js");

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use(authRouter);
  app.use(errorHandler);
  return app;
};

describe("email and password-recovery auth routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isAuthenticated = true;
  });

  test("accepts a verification token and forwards it to the public controller", async () => {
    await request(createApp())
      .post("/verify-email")
      .send({ token: "verification-token" })
      .expect(200, { message: "Email успішно підтверджено.", userId: 7 });

    expect(verifyEmailController).toHaveBeenCalledWith(
      expect.objectContaining({ body: { token: "verification-token" } }),
      expect.anything(),
      expect.anything(),
    );
    expect(authenticate).not.toHaveBeenCalled();
  });

  test("rejects a request without token before it reaches the controller", async () => {
    const response = await request(createApp()).post("/verify-email").send({}).expect(400);

    expect(response.body.message).toContain("Токен підтвердження обов'язковий");
    expect(verifyEmailController).not.toHaveBeenCalled();
  });

  test("accepts a password recovery request without authentication", async () => {
    await request(createApp())
      .post("/forgot-password")
      .send({ email: "worker@example.com" })
      .expect(202, {
        message: "Якщо акаунт з такою email-адресою існує, ми надіслали інструкції для відновлення пароля.",
      });

    expect(forgotPasswordRateLimit).toHaveBeenCalledTimes(1);
    expect(forgotPasswordController).toHaveBeenCalledWith(
      expect.objectContaining({ body: { email: "worker@example.com" } }),
      expect.anything(),
      expect.anything(),
    );
    expect(authenticate).not.toHaveBeenCalled();
  });

  test("validates the reset-password payload before reaching the controller", async () => {
    await request(createApp())
      .post("/reset-password")
      .send({ token: "reset-token", password: "short" })
      .expect(400);

    expect(resetPasswordController).not.toHaveBeenCalled();

    await request(createApp())
      .post("/reset-password")
      .send({ token: "reset-token", password: "new-secure-password" })
      .expect(200, { message: "Пароль успішно оновлено. Тепер увійдіть з новим паролем." });

    expect(resetPasswordRateLimit).toHaveBeenCalledTimes(2);
    expect(resetPasswordController).toHaveBeenCalledTimes(1);
  });

  test("requires authentication before accepting a resend request", async () => {
    await request(createApp())
      .post("/resend-verification")
      .expect(202, { message: "Лист для підтвердження надіслано повторно." });

    expect(authenticate).toHaveBeenCalledTimes(1);
    expect(resendVerificationRateLimit).toHaveBeenCalledTimes(1);
    expect(resendEmailVerificationController).toHaveBeenCalledTimes(1);
  });

  test("does not reach rate limit or controller without authentication", async () => {
    isAuthenticated = false;

    await request(createApp())
      .post("/resend-verification")
      .expect(401, { message: "Unauthorized" });

    expect(authenticate).toHaveBeenCalledTimes(1);
    expect(resendVerificationRateLimit).not.toHaveBeenCalled();
    expect(resendEmailVerificationController).not.toHaveBeenCalled();
  });
});

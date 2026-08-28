import express from "express";
import request from "supertest";
import requireVerifiedEmail from "../middlewares/requireVerifiedEmail.js";

const createApp = (user) => {
  const app = express();

  app.get(
    "/",
    (req, _res, next) => {
      if (user) req.user = user;
      next();
    },
    requireVerifiedEmail,
    (_req, res) => res.sendStatus(204),
  );

  app.use((error, _req, res, _next) => {
    res.status(error.status ?? 500).json({ message: error.message });
  });

  return app;
};

describe("requireVerifiedEmail middleware", () => {
  test("allows a verified user to continue", async () => {
    await request(createApp({ id: 42, isVerified: true })).get("/").expect(204);
  });

  test("blocks an authenticated user with an unverified email", async () => {
    await request(createApp({ id: 42, isVerified: false }))
      .get("/")
      .expect(403, {
        message: "Підтвердьте електронну пошту, щоб виконувати цю дію.",
      });
  });

  test("defensively rejects a route without authenticated user", async () => {
    await request(createApp(null))
      .get("/")
      .expect(401, { message: "Користувач не авторизований." });
  });
});

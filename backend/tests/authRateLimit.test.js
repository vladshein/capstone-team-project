import express from "express";
import request from "supertest";

import {
  loginRateLimit,
  forgotPasswordRateLimit,
  registerRateLimit,
  resetPasswordRateLimit,
  resendVerificationRateLimit,
} from "../middlewares/authRateLimit.js";

const createApp = (middleware) => {
  const app = express();
  app.post("/", middleware, (_req, res) => res.status(200).json({ ok: true }));
  return app;
};

describe("auth rate limits", () => {
  test("limits registration attempts after five requests from one client", async () => {
    const app = createApp(registerRateLimit);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app).post("/").expect(200, { ok: true });
    }

    await request(app)
      .post("/")
      .expect(429, { message: "Забагато спроб. Спробуйте ще раз пізніше." });
  });

  test("does not limit successful login requests", async () => {
    const app = createApp(loginRateLimit);

    for (let attempt = 0; attempt < 11; attempt += 1) {
      await request(app).post("/").expect(200, { ok: true });
    }
  });

  test("allows only one verification resend per five minutes from one client", async () => {
    const app = createApp(resendVerificationRateLimit);

    await request(app).post("/").expect(200, { ok: true });
    await request(app)
      .post("/")
      .expect(429, { message: "Забагато спроб. Спробуйте ще раз пізніше." });
  });

  test("limits password-reset email requests after three attempts", async () => {
    const app = createApp(forgotPasswordRateLimit);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await request(app).post("/").expect(200, { ok: true });
    }

    await request(app)
      .post("/")
      .expect(429, { message: "Забагато спроб. Спробуйте ще раз пізніше." });
  });

  test("limits password changes after five attempts", async () => {
    const app = createApp(resetPasswordRateLimit);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app).post("/").expect(200, { ok: true });
    }

    await request(app)
      .post("/")
      .expect(429, { message: "Забагато спроб. Спробуйте ще раз пізніше." });
  });
});

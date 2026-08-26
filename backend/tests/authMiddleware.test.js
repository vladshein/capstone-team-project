import { jest } from "@jest/globals";
import express from "express";
import request from "supertest";

const verifyAccessToken = jest.fn();
const hasCurrentAuthTokenFingerprint = jest.fn();
const findUser = jest.fn();

jest.unstable_mockModule("../helpers/jwt.js", () => ({
  hasCurrentAuthTokenFingerprint,
  verifyAccessToken,
}));
jest.unstable_mockModule("../services/authServices.js", () => ({ findUser }));

const { default: authenticate } = await import("../middlewares/authenticate.js");
const { default: optionalAuthenticate } = await import("../middlewares/optionalAuthenticate.js");
const { default: checkRole } = await import("../middlewares/checkRole.js");

const createApp = (middleware) => {
  const app = express();
  app.get("/", middleware, (req, res) => res.json({ user: req.user ?? null }));
  app.use((error, _req, res, _next) => {
    res.status(error.status ?? 500).json({ message: error.message });
  });
  return app;
};

describe("authentication and role middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("rejects a protected route without an Authorization header", async () => {
    const app = createApp(authenticate);

    await request(app)
      .get("/")
      .expect(401, { message: "Authorization header missed" });
  });

  test("adds the authenticated user to the request", async () => {
    verifyAccessToken.mockReturnValue({
      data: { id: 42, authFingerprint: "current-fingerprint" },
      error: null,
    });
    findUser.mockResolvedValue({ id: 42, role: "worker", passwordHash: "current-hash" });
    hasCurrentAuthTokenFingerprint.mockReturnValue(true);
    const app = createApp(authenticate);

    await request(app)
      .get("/")
      .set("Authorization", "Bearer valid-token")
      .expect(200, {
        user: { id: 42, role: "worker", passwordHash: "current-hash" },
      });
  });

  test("rejects an access token issued before a password change", async () => {
    verifyAccessToken.mockReturnValue({
      data: { id: 42, authFingerprint: "old-fingerprint" },
      error: null,
    });
    findUser.mockResolvedValue({ id: 42, role: "worker", passwordHash: "new-hash" });
    hasCurrentAuthTokenFingerprint.mockReturnValue(false);
    const app = createApp(authenticate);

    await request(app)
      .get("/")
      .set("Authorization", "Bearer old-token")
      .expect(401, { message: "Authentication token is no longer valid" });
  });

  test("does not block a guest on an optional authentication route", async () => {
    const app = createApp(optionalAuthenticate);

    await request(app).get("/").expect(200, { user: null });
  });

  test("ignores an invalid optional token instead of rejecting the public route", async () => {
    verifyAccessToken.mockReturnValue({ data: null, error: new Error("invalid token") });
    const app = createApp(optionalAuthenticate);

    await request(app)
      .get("/")
      .set("Authorization", "Bearer invalid-token")
      .expect(200, { user: null });
  });

  test("treats an outdated optional token as a guest session", async () => {
    verifyAccessToken.mockReturnValue({
      data: { id: 42, authFingerprint: "old-fingerprint" },
      error: null,
    });
    findUser.mockResolvedValue({ id: 42, passwordHash: "new-hash" });
    hasCurrentAuthTokenFingerprint.mockReturnValue(false);
    const app = createApp(optionalAuthenticate);

    await request(app)
      .get("/")
      .set("Authorization", "Bearer old-token")
      .expect(200, { user: null });
  });

  test("rejects a user whose role is not allowed", async () => {
    const app = express();
    app.get("/", (req, _res, next) => {
      req.user = { id: 42, role: "worker" };
      next();
    }, checkRole("business_client"), (_req, res) => res.sendStatus(204));
    app.use((error, _req, res, _next) => {
      res.status(error.status ?? 500).json({ message: error.message });
    });

    await request(app)
      .get("/")
      .expect(403, { message: "Доступ заборонено. Недостатньо прав." });
  });
});

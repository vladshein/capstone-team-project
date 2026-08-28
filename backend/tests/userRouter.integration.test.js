import { jest } from "@jest/globals";
import express from "express";
import request from "supertest";

const authenticate = jest.fn((req, _res, next) => {
  req.user = { id: 7, role: "worker" };
  next();
});
const resolveProfileStrategy = jest.fn((req, _res, next) => {
  req.profileStrategy = jest.fn();
  next();
});
const getCurrentUser = jest.fn((_req, res) => res.json({ id: 7, profileCompleted: true }));
const getUserById = jest.fn((req, res) => res.json({ id: Number(req.params.userId) }));
const getFollowingController = jest.fn((_req, res) => res.json({}));
const getFollowersController = jest.fn((_req, res) => res.json({}));
const updateAvatarController = jest.fn((_req, res) => res.sendStatus(204));

jest.unstable_mockModule("../middlewares/authenticate.js", () => ({ default: authenticate }));
jest.unstable_mockModule("../middlewares/resolveProfileStrategy.js", () => ({
  default: resolveProfileStrategy,
}));
jest.unstable_mockModule("../middlewares/upload.js", () => ({
  default: { single: () => (_req, _res, next) => next() },
}));
jest.unstable_mockModule("../controllers/userControllers.js", () => ({
  getCurrentUser,
  getUserById,
  getFollowingController,
  getFollowersController,
}));
jest.unstable_mockModule("../controllers/authControllers.js", () => ({
  updateAvatarController,
}));

const { default: userRouter } = await import("../routes/userRouter.js");

const createApp = () => {
  const app = express();
  app.use(userRouter);
  return app;
};

describe("user router wiring", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("runs profile strategy before handling the current-user route", async () => {
    await request(createApp()).get("/current").expect(200, {
      id: 7,
      profileCompleted: true,
    });

    expect(authenticate).toHaveBeenCalledTimes(1);
    expect(resolveProfileStrategy).toHaveBeenCalledTimes(1);
    expect(getCurrentUser).toHaveBeenCalledTimes(1);
  });

  test("keeps a separate authenticated route for the minimal user lookup", async () => {
    await request(createApp()).get("/19").expect(200, { id: 19 });

    expect(authenticate).toHaveBeenCalledTimes(1);
    expect(resolveProfileStrategy).not.toHaveBeenCalled();
    expect(getUserById).toHaveBeenCalledTimes(1);
  });
});

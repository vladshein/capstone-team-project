import { jest } from "@jest/globals";

const getWorkerProfile = jest.fn();
const getCompanyProfile = jest.fn();
const getUserById = jest.fn();

jest.unstable_mockModule("../services/workerServices.js", () => ({
  getWorkerProfile,
}));

jest.unstable_mockModule("../services/businessServices.js", () => ({
  getCompanyProfile,
}));

jest.unstable_mockModule("../services/userServices.js", () => ({
  getUserById,
}));

const { default: resolveProfileStrategy } = await import(
  "../middlewares/resolveProfileStrategy.js"
);
const {
  getCurrentUser,
  getUserById: getUserByIdController,
} = await import("../controllers/userControllers.js");

const createResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("resolveProfileStrategy middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("selects the worker profile service for a worker", () => {
    const req = { user: { role: "worker" } };
    const next = jest.fn();

    resolveProfileStrategy(req, {}, next);

    expect(req.profileStrategy).toBe(getWorkerProfile);
    expect(next).toHaveBeenCalledWith();
  });

  test("selects the business profile service for a business user", () => {
    const req = { user: { role: "business_client" } };
    const next = jest.fn();

    resolveProfileStrategy(req, {}, next);

    expect(req.profileStrategy).toBe(getCompanyProfile);
    expect(next).toHaveBeenCalledWith();
  });

  test("rejects a role that has no supported profile strategy", () => {
    const req = { user: { role: "admin" } };
    const next = jest.fn();

    resolveProfileStrategy(req, {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 403,
        message: "Profile endpoint not supported for role: admin",
      }),
    );
    expect(req.profileStrategy).toBeUndefined();
  });
});

describe("user controllers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns the current user data through the strategy selected by middleware", async () => {
    const profile = { id: 7, profileCompleted: true };
    const profileStrategy = jest.fn().mockResolvedValue(profile);
    const res = createResponse();
    const next = jest.fn();

    await getCurrentUser({ user: { id: 7 }, profileStrategy }, res, next);

    expect(profileStrategy).toHaveBeenCalledWith(7);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(profile);
    expect(next).not.toHaveBeenCalled();
  });

  test("passes profile-service failures to the error middleware", async () => {
    const error = new Error("database unavailable");
    const res = createResponse();
    const next = jest.fn();

    await getCurrentUser(
      {
        user: { id: 7 },
        profileStrategy: jest.fn().mockRejectedValue(error),
      },
      res,
      next,
    );

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });

  test("returns the result of a direct user lookup", async () => {
    const user = { id: 19, email: "user@example.com" };
    const res = createResponse();
    getUserById.mockResolvedValue(user);

    await getUserByIdController({ params: { userId: "19" } }, res);

    expect(getUserById).toHaveBeenCalledWith("19");
    expect(res.json).toHaveBeenCalledWith(user);
  });
});

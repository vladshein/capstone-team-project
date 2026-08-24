import { jest } from "@jest/globals";

const registerUser = jest.fn();
const loginUser = jest.fn();
const refreshUser = jest.fn();
const updateAvatar = jest.fn();

jest.unstable_mockModule("../services/authServices.js", () => ({
  registerUser,
  loginUser,
  refreshUser,
  updateAvatar,
  // Imported by the controller module, but follower functionality is outside
  // the API coverage scope of this test suite.
  getUserFollowers: jest.fn(),
}));

const controller = await import("../controllers/authControllers.js");

const createResponse = () => {
  const res = {};
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe("auth controllers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("registers a user, sets an httpOnly refresh cookie and keeps the refresh token out of JSON", async () => {
    const body = { email: "worker@example.com", password: "password" };
    registerUser.mockResolvedValue({
      refreshToken: "refresh-token",
      accessToken: "access-token",
      user: { id: 7 },
    });
    const res = createResponse();

    await controller.registerController({ body }, res);

    expect(registerUser).toHaveBeenCalledWith(body);
    expect(res.cookie).toHaveBeenCalledWith(
      "refreshToken",
      "refresh-token",
      expect.objectContaining({
        httpOnly: true,
        path: "/api/auth",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      accessToken: "access-token",
      user: { id: 7 },
    });
  });

  test("logs in with the validated request body and rotates the browser refresh cookie", async () => {
    const body = { email: "worker@example.com", password: "password" };
    loginUser.mockResolvedValue({
      refreshToken: "new-refresh-token",
      accessToken: "access-token",
      user: { id: 7 },
    });
    const res = createResponse();

    await controller.loginController({ body }, res);

    expect(loginUser).toHaveBeenCalledWith(body);
    expect(res.cookie).toHaveBeenCalledWith(
      "refreshToken",
      "new-refresh-token",
      expect.objectContaining({ httpOnly: true, path: "/api/auth" }),
    );
    expect(res.json).toHaveBeenCalledWith({
      accessToken: "access-token",
      user: { id: 7 },
    });
  });

  test("passes the refresh cookie to the service and returns only the public token payload", async () => {
    refreshUser.mockResolvedValue({
      refreshToken: "rotated-refresh-token",
      accessToken: "rotated-access-token",
      user: { id: 7 },
    });
    const res = createResponse();

    await controller.refreshController({ cookies: { refreshToken: "old-refresh-token" } }, res);

    expect(refreshUser).toHaveBeenCalledWith("old-refresh-token");
    expect(res.cookie).toHaveBeenCalledWith(
      "refreshToken",
      "rotated-refresh-token",
      expect.objectContaining({ httpOnly: true, path: "/api/auth" }),
    );
    expect(res.json).toHaveBeenCalledWith({
      accessToken: "rotated-access-token",
      user: { id: 7 },
    });
  });

  test("clears the refresh cookie on logout", async () => {
    const res = createResponse();

    await controller.logoutController({}, res);

    expect(res.clearCookie).toHaveBeenCalledWith("refreshToken", { path: "/api/auth" });
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  test("rejects avatar updates with no uploaded file", async () => {
    const res = createResponse();

    await controller.updateAvatarController({ user: { id: 7 } }, res, jest.fn());

    expect(updateAvatar).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Please upload a file" });
  });

  test("forwards a file and authenticated user to the avatar service and propagates its errors", async () => {
    const result = { avatarUrl: "https://example.test/avatar.png" };
    const req = { user: { id: 7 }, file: { filename: "avatar.png" } };
    const res = createResponse();
    updateAvatar.mockResolvedValue(result);

    await controller.updateAvatarController(req, res, jest.fn());

    expect(updateAvatar).toHaveBeenCalledWith(req.user, req.file);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(result);

    const error = new Error("upload failed");
    const next = jest.fn();
    updateAvatar.mockRejectedValue(error);
    await controller.updateAvatarController(req, createResponse(), next);
    expect(next).toHaveBeenCalledWith(error);
  });

});

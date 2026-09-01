import { jest } from "@jest/globals";

const registerUser = jest.fn();
const loginUser = jest.fn();
const refreshUser = jest.fn();
const updateAvatar = jest.fn();
const verifyUserEmail = jest.fn();
const ensureEmailIsNotVerified = jest.fn();
const getPasswordResetRequestUserId = jest.fn();
const resetUserPassword = jest.fn();
const enqueueEmailVerification = jest.fn();
const enqueuePasswordReset = jest.fn();

jest.unstable_mockModule("../services/authServices.js", () => ({
  registerUser,
  loginUser,
  refreshUser,
  updateAvatar,
  verifyUserEmail,
  ensureEmailIsNotVerified,
  getPasswordResetRequestUserId,
  resetUserPassword,
}));

jest.unstable_mockModule("../queues/shiftLifecycleQueue.js", () => ({
  enqueueEmailVerification,
  enqueuePasswordReset,
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
    enqueueEmailVerification.mockResolvedValue(undefined);
    enqueuePasswordReset.mockResolvedValue(undefined);
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
    expect(enqueueEmailVerification).toHaveBeenCalledWith(7);
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

  test("verifies a token and returns a user-friendly message", async () => {
    verifyUserEmail.mockResolvedValue({ alreadyVerified: false, userId: 7 });
    const res = createResponse();

    await controller.verifyEmailController({ body: { token: "verification-token" } }, res);

    expect(verifyUserEmail).toHaveBeenCalledWith("verification-token");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Email успішно підтверджено.",
      alreadyVerified: false,
      userId: 7,
    });
  });

  test("queues a new email only for an unverified authenticated user", async () => {
    ensureEmailIsNotVerified.mockResolvedValue(undefined);
    const res = createResponse();

    await controller.resendEmailVerificationController({ user: { id: 7 } }, res);

    expect(ensureEmailIsNotVerified).toHaveBeenCalledWith(7);
    expect(enqueueEmailVerification).toHaveBeenCalledWith(7);
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({
      message: "Лист для підтвердження надіслано повторно.",
    });
  });

  test("returns the same accepted response for a password reset request and queues a known user", async () => {
    getPasswordResetRequestUserId.mockResolvedValue(7);
    const res = createResponse();

    await controller.forgotPasswordController({ body: { email: "worker@example.com" } }, res);

    expect(getPasswordResetRequestUserId).toHaveBeenCalledWith("worker@example.com");
    expect(enqueuePasswordReset).toHaveBeenCalledWith(7);
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({
      message: "Якщо акаунт з такою email-адресою існує, ми надіслали інструкції для відновлення пароля.",
    });
  });

  test("does not disclose an unknown email in a password reset request", async () => {
    getPasswordResetRequestUserId.mockResolvedValue(null);
    const res = createResponse();

    await controller.forgotPasswordController({ body: { email: "unknown@example.com" } }, res);

    expect(enqueuePasswordReset).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({
      message: "Якщо акаунт з такою email-адресою існує, ми надіслали інструкції для відновлення пароля.",
    });
  });

  test("resets a password and clears the current refresh cookie", async () => {
    resetUserPassword.mockResolvedValue(undefined);
    const body = { token: "reset-token", password: "new-secure-password" };
    const res = createResponse();

    await controller.resetPasswordController({ body }, res);

    expect(resetUserPassword).toHaveBeenCalledWith(body);
    expect(res.clearCookie).toHaveBeenCalledWith("refreshToken", { path: "/api/auth" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Пароль успішно оновлено. Тепер увійдіть з новим паролем.",
    });
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

import { jest } from "@jest/globals";
import { Op } from "sequelize";

const findUser = jest.fn();
const createUser = jest.fn();
const findUserByPk = jest.fn();
const findWorkerProfile = jest.fn();
const hashPassword = jest.fn();
const comparePassword = jest.fn();
const gravatarUrl = jest.fn();
const renameFile = jest.fn();
const createAccessToken = jest.fn();
const createEmailVerificationToken = jest.fn();
const createRefreshToken = jest.fn();
const verifyEmailVerificationToken = jest.fn();
const verifyRefreshToken = jest.fn();

jest.unstable_mockModule("../db/models/index.js", () => ({
  User: {
    findOne: findUser,
    create: createUser,
    findByPk: findUserByPk,
  },
  WorkerProfile: { findOne: findWorkerProfile },
}));

jest.unstable_mockModule("bcrypt", () => ({
  default: { hash: hashPassword, compare: comparePassword },
}));

jest.unstable_mockModule("gravatar", () => ({
  default: { url: gravatarUrl },
}));

jest.unstable_mockModule("node:fs/promises", () => ({
  rename: renameFile,
}));

jest.unstable_mockModule("../helpers/jwt.js", () => ({
  createAccessToken,
  createEmailVerificationToken,
  createRefreshToken,
  verifyEmailVerificationToken,
  verifyRefreshToken,
}));

const {
  registerUser,
  loginUser,
  refreshUser,
  updateAvatar,
  getUserFollowers,
  getEmailVerificationRecipient,
  verifyUserEmail,
  ensureEmailIsNotVerified,
} = await import("../services/authServices.js");

const createStoredUser = (overrides = {}) => ({
  id: 42,
  email: "worker@example.com",
  phone: "+380501112233",
  role: "worker",
  avatar: "https://avatar.example/worker.png",
  isVerified: false,
  passwordHash: "stored-hash",
  ...overrides,
});

describe("auth services", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("registers a unique user with a hashed password and returns both tokens", async () => {
    const payload = {
      email: "worker@example.com",
      phone: "+380501112233",
      password: "secure-password",
      role: "worker",
    };
    const storedUser = createStoredUser();

    findUser.mockResolvedValue(null);
    gravatarUrl.mockReturnValue("https://avatar.example/generated.png");
    hashPassword.mockResolvedValue("hashed-password");
    createUser.mockResolvedValue(storedUser);
    createAccessToken.mockReturnValue("access-token");
    createRefreshToken.mockReturnValue("refresh-token");

    await expect(registerUser(payload)).resolves.toEqual({
      user: {
        id: 42,
        email: payload.email,
        role: "worker",
        displayName: payload.email,
        avatarUrl: storedUser.avatar,
        phone: payload.phone,
        isVerified: false,
      },
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    expect(findUser).toHaveBeenCalledWith({
      where: { [Op.or]: [{ email: payload.email }, { phone: payload.phone }] },
    });
    expect(hashPassword).toHaveBeenCalledWith(payload.password, 10);
    expect(createUser).toHaveBeenCalledWith({
      email: payload.email,
      phone: payload.phone,
      passwordHash: "hashed-password",
      avatar: "https://avatar.example/generated.png",
      role: "worker",
    });
    expect(createAccessToken).toHaveBeenCalledWith({ id: storedUser.id });
    expect(createRefreshToken).toHaveBeenCalledWith({ id: storedUser.id });
  });

  test("rejects registration when the email is already registered", async () => {
    findUser.mockResolvedValue(
      createStoredUser({ email: "worker@example.com", phone: "+380509999999" }),
    );

    await expect(
      registerUser({
        email: "worker@example.com",
        phone: "+380501112233",
        password: "secure-password",
        role: "worker",
      }),
    ).rejects.toMatchObject({
      status: 409,
      message: "Email вже використовується",
    });

    expect(createUser).not.toHaveBeenCalled();
    expect(hashPassword).not.toHaveBeenCalled();
  });

  test("rejects registration when the phone number is already registered", async () => {
    findUser.mockResolvedValue(
      createStoredUser({ email: "another@example.com", phone: "+380501112233" }),
    );

    await expect(
      registerUser({
        email: "worker@example.com",
        phone: "+380501112233",
        password: "secure-password",
        role: "worker",
      }),
    ).rejects.toMatchObject({
      status: 409,
      message: "Номер телефону вже використовується",
    });

    expect(createUser).not.toHaveBeenCalled();
  });

  test("logs in a worker and uses the worker profile for the display name", async () => {
    const user = createStoredUser();
    findUser.mockResolvedValue(user);
    comparePassword.mockResolvedValue(true);
    findWorkerProfile.mockResolvedValue({ firstName: "Іван", lastName: "Петренко" });
    createAccessToken.mockReturnValue("new-access-token");
    createRefreshToken.mockReturnValue("new-refresh-token");

    await expect(
      loginUser({ email: user.email, password: "secure-password" }),
    ).resolves.toEqual({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: "Іван Петренко",
        avatarUrl: user.avatar,
        phone: user.phone,
        isVerified: false,
      },
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
    });

    expect(comparePassword).toHaveBeenCalledWith("secure-password", "stored-hash");
    expect(findWorkerProfile).toHaveBeenCalledWith({
      where: { userId: user.id },
      attributes: ["firstName", "lastName"],
    });
  });

  test("rejects login for an unknown email without checking a password", async () => {
    findUser.mockResolvedValue(null);

    await expect(
      loginUser({ email: "missing@example.com", password: "secure-password" }),
    ).rejects.toMatchObject({ status: 401, message: "Email or password invalid" });

    expect(comparePassword).not.toHaveBeenCalled();
    expect(createAccessToken).not.toHaveBeenCalled();
  });

  test("rejects login when the password does not match", async () => {
    findUser.mockResolvedValue(createStoredUser());
    comparePassword.mockResolvedValue(false);

    await expect(
      loginUser({ email: "worker@example.com", password: "wrong-password" }),
    ).rejects.toMatchObject({ status: 401, message: "Email or password invalid" });

    expect(createAccessToken).not.toHaveBeenCalled();
    expect(createRefreshToken).not.toHaveBeenCalled();
  });

  test("rejects a refresh request with no token", async () => {
    await expect(refreshUser()).rejects.toMatchObject({
      status: 401,
      message: "No refresh token",
    });

    expect(verifyRefreshToken).not.toHaveBeenCalled();
  });

  test("rejects an invalid refresh token", async () => {
    verifyRefreshToken.mockReturnValue({ data: null, error: new Error("invalid") });

    await expect(refreshUser("bad-token")).rejects.toMatchObject({
      status: 401,
      message: "Invalid refresh token",
    });

    expect(findUser).not.toHaveBeenCalled();
  });

  test("rejects a valid refresh token when its user no longer exists", async () => {
    verifyRefreshToken.mockReturnValue({ data: { id: 42 }, error: null });
    findUser.mockResolvedValue(null);

    await expect(refreshUser("valid-token")).rejects.toMatchObject({
      status: 401,
      message: "User not found",
    });
  });

  test("rotates tokens for a valid refresh request", async () => {
    const user = createStoredUser({ role: "business_client", name: "Кав'ярня" });
    verifyRefreshToken.mockReturnValue({ data: { id: user.id }, error: null });
    findUser.mockResolvedValue(user);
    createAccessToken.mockReturnValue("rotated-access-token");
    createRefreshToken.mockReturnValue("rotated-refresh-token");

    await expect(refreshUser("valid-token")).resolves.toEqual({
      user: {
        id: user.id,
        email: user.email,
        role: "business_client",
        displayName: "Кав'ярня",
        avatarUrl: user.avatar,
        phone: user.phone,
        isVerified: false,
      },
      accessToken: "rotated-access-token",
      refreshToken: "rotated-refresh-token",
    });

    expect(findWorkerProfile).not.toHaveBeenCalled();
    expect(createAccessToken).toHaveBeenCalledWith({ id: user.id });
    expect(createRefreshToken).toHaveBeenCalledWith({ id: user.id });
  });

  test("creates a verification recipient only for an existing unverified user", async () => {
    const user = createStoredUser();
    findUserByPk.mockResolvedValue(user);
    createEmailVerificationToken.mockReturnValue("verification-token");

    await expect(getEmailVerificationRecipient(user.id)).resolves.toEqual({
      email: user.email,
      token: "verification-token",
    });

    expect(findUserByPk).toHaveBeenCalledWith(user.id, {
      attributes: ["id", "email", "isVerified"],
    });
    expect(createEmailVerificationToken).toHaveBeenCalledWith({ id: user.id });
  });

  test("skips a verification email for an already verified or deleted user", async () => {
    findUserByPk
      .mockResolvedValueOnce(createStoredUser({ isVerified: true }))
      .mockResolvedValueOnce(null);

    await expect(getEmailVerificationRecipient(42)).resolves.toBeNull();
    await expect(getEmailVerificationRecipient(999)).resolves.toBeNull();
    expect(createEmailVerificationToken).not.toHaveBeenCalled();
  });

  test("marks a user as verified and treats a repeated link as idempotent", async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    verifyEmailVerificationToken.mockReturnValue({ data: { id: 42 }, error: null });
    findUserByPk
      .mockResolvedValueOnce({ id: 42, isVerified: false, update })
      .mockResolvedValueOnce({ id: 42, isVerified: true });

    await expect(verifyUserEmail("valid-token")).resolves.toEqual({
      alreadyVerified: false,
      userId: 42,
    });
    await expect(verifyUserEmail("same-token")).resolves.toEqual({
      alreadyVerified: true,
      userId: 42,
    });

    expect(update).toHaveBeenCalledWith({ isVerified: true });
  });

  test("rejects invalid verification links and prevents resending for a verified user", async () => {
    verifyEmailVerificationToken.mockReturnValue({ data: null, error: new Error("expired") });

    await expect(verifyUserEmail("expired-token")).rejects.toMatchObject({ status: 400 });

    findUserByPk.mockResolvedValue({ id: 42, isVerified: true });
    await expect(ensureEmailIsNotVerified(42)).rejects.toMatchObject({
      status: 409,
      message: "Email уже підтверджено.",
    });
  });

  test("moves an uploaded avatar and persists the public avatar path", async () => {
    const user = { update: jest.fn().mockResolvedValue(undefined) };
    renameFile.mockResolvedValue(undefined);

    await expect(
      updateAvatar(user, { path: "/tmp/upload-file", filename: "new-avatar.png" }),
    ).resolves.toEqual({ avatar: "avatars/new-avatar.png" });

    expect(renameFile).toHaveBeenCalledWith(
      "/tmp/upload-file",
      expect.stringMatching(/public[\\/]avatars[\\/]new-avatar\.png$/),
    );
    expect(user.update).toHaveBeenCalledWith({ avatar: "avatars/new-avatar.png" });
  });

  test("returns a user's followers and returns an empty array for an unknown user", async () => {
    const followers = [{ id: 3, email: "follower@example.com" }];
    findUserByPk.mockResolvedValueOnce({ followers }).mockResolvedValueOnce(null);

    await expect(getUserFollowers(42)).resolves.toBe(followers);
    await expect(getUserFollowers(999)).resolves.toEqual([]);

    expect(findUserByPk).toHaveBeenNthCalledWith(1, 42, {
      include: [
        {
          model: expect.anything(),
          as: "followers",
          attributes: ["id", "name", "email", "avatar"],
          through: { attributes: [] },
        },
      ],
    });
  });
});

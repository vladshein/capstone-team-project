import { jest } from "@jest/globals";

const findOne = jest.fn();
const findByPk = jest.fn();

jest.unstable_mockModule("../db/models/index.js", () => ({
  User: { findOne, findByPk },
}));

const {
  findUser,
  getCurrentUserInfo,
  getUserById,
} = await import("../services/userServices.js");

describe("user services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("finds a user by an arbitrary safe condition", async () => {
    const user = { id: 7 };
    findOne.mockResolvedValue(user);

    await expect(findUser({ email: "user@example.com" })).resolves.toBe(user);
    expect(findOne).toHaveBeenCalledWith({ where: { email: "user@example.com" } });
  });

  test("loads the current user projection", async () => {
    const user = { id: 7, email: "user@example.com" };
    findOne.mockResolvedValue(user);

    await expect(getCurrentUserInfo(7)).resolves.toBe(user);
    expect(findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 7 },
      attributes: ["id", "avatar", "email", "role", "isVerified"],
    }));
  });

  test("returns only the safe account projection for a direct user lookup", async () => {
    const user = { id: 7, role: "worker", avatar: null, isVerified: false };
    findByPk.mockResolvedValue(user);

    await expect(getUserById(7)).resolves.toBe(user);
    expect(findByPk).toHaveBeenCalledWith(7, {
      attributes: ["id", "role", "avatar", "isVerified"],
    });
  });

  test("returns 404 when the requested user does not exist", async () => {
    findByPk.mockResolvedValue(null);

    await expect(getUserById(404)).rejects.toMatchObject({
      status: 404,
      message: "User not found",
    });
  });
});

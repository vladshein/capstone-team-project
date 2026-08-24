import { jest } from "@jest/globals";

const findWorkerProfile = jest.fn();
const createWorkerProfile = jest.fn();
const workerProfileModel = {
  findOne: findWorkerProfile,
  create: createWorkerProfile,
};
const userModel = {};

jest.unstable_mockModule("../db/models/index.js", () => ({
  WorkerProfile: workerProfileModel,
  User: userModel,
  Wallet: {},
}));

const {
  getProfileByUserId,
  getPublicProfileByUserId,
  createProfile,
  updateProfile,
} = await import("../services/workerProfileServices.js");

describe("worker profile services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("loads a private profile with the account fields needed by the cabinet", async () => {
    const profile = { id: 4 };
    findWorkerProfile.mockResolvedValue(profile);

    await expect(getProfileByUserId(17)).resolves.toBe(profile);

    expect(findWorkerProfile).toHaveBeenCalledWith({
      where: { userId: 17 },
      include: [
        {
          model: userModel,
          attributes: ["phone", "email", "isVerified"],
        },
      ],
    });
  });

  test("does not select a phone number for a guest viewing a public profile", async () => {
    const profile = { id: 4, firstName: "Ірина" };
    findWorkerProfile.mockResolvedValue(profile);

    await expect(getPublicProfileByUserId(17)).resolves.toBe(profile);

    expect(findWorkerProfile).toHaveBeenCalledWith({
      where: { userId: 17 },
      attributes: [
        "id",
        "userId",
        "firstName",
        "lastName",
        "rating",
        "avatarUrl",
        "description",
      ],
      include: [
        {
          model: userModel,
          attributes: ["id", "avatar"],
        },
      ],
    });
  });

  test("selects a phone number for an authorized public-profile request", async () => {
    const profile = { id: 4, firstName: "Ірина" };
    findWorkerProfile.mockResolvedValue(profile);

    await expect(
      getPublicProfileByUserId(17, { includePhone: true }),
    ).resolves.toBe(profile);

    expect(findWorkerProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        include: [
          {
            model: userModel,
            attributes: ["id", "avatar", "phone"],
          },
        ],
      }),
    );
  });

  test("returns a 404 error when a public worker profile does not exist", async () => {
    findWorkerProfile.mockResolvedValue(null);

    await expect(getPublicProfileByUserId(404)).rejects.toMatchObject({
      status: 404,
      message: "Профіль виконавця не знайдено",
    });
  });

  test("creates a profile only after both user and tax-number uniqueness checks pass", async () => {
    const profileData = {
      firstName: "Ірина",
      lastName: "Коваль",
      taxNumber: "1234567890",
    };
    const createdProfile = { id: 4, userId: 17, ...profileData };
    findWorkerProfile.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    createWorkerProfile.mockResolvedValue(createdProfile);

    await expect(createProfile(17, profileData)).resolves.toBe(createdProfile);

    expect(findWorkerProfile).toHaveBeenNthCalledWith(1, {
      where: { userId: 17 },
    });
    expect(findWorkerProfile).toHaveBeenNthCalledWith(2, {
      where: { taxNumber: "1234567890" },
    });
    expect(createWorkerProfile).toHaveBeenCalledWith({
      userId: 17,
      ...profileData,
    });
  });

  test("does not create a second profile for the same user", async () => {
    findWorkerProfile.mockResolvedValue({ id: 4, userId: 17 });

    await expect(createProfile(17, { firstName: "Ірина" })).rejects.toMatchObject({
      status: 400,
      message: "Профіль для цього користувача вже існує",
    });

    expect(createWorkerProfile).not.toHaveBeenCalled();
    expect(findWorkerProfile).toHaveBeenCalledTimes(1);
  });

  test("does not create a profile with a tax number already used by another worker", async () => {
    findWorkerProfile
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 8, taxNumber: "1234567890" });

    await expect(
      createProfile(17, { firstName: "Ірина", taxNumber: "1234567890" }),
    ).rejects.toMatchObject({
      status: 409,
      message: "Цей ІПН вже зареєстровано в системі",
    });

    expect(createWorkerProfile).not.toHaveBeenCalled();
  });

  test("reports a missing profile before attempting an update", async () => {
    findWorkerProfile.mockResolvedValue(null);

    await expect(updateProfile(17, { firstName: "Ірина" })).rejects.toMatchObject({
      status: 404,
      message: "Профіль не знайдено. Спочатку створіть його.",
    });
  });

  test("does not let a worker change their profile to another worker's tax number", async () => {
    const profile = {
      id: 4,
      taxNumber: "1111111111",
      update: jest.fn(),
    };
    findWorkerProfile
      .mockResolvedValueOnce(profile)
      .mockResolvedValueOnce({ id: 8, taxNumber: "2222222222" });

    await expect(
      updateProfile(17, { taxNumber: "2222222222" }),
    ).rejects.toMatchObject({
      status: 409,
      message: "Цей ІПН вже використовується іншим користувачем",
    });

    expect(profile.update).not.toHaveBeenCalled();
  });

  test("updates a profile without querying tax-number uniqueness when the tax number is unchanged", async () => {
    const profile = {
      id: 4,
      taxNumber: "1111111111",
      update: jest.fn().mockResolvedValue({ id: 4, firstName: "Ірина" }),
    };
    findWorkerProfile.mockResolvedValue(profile);

    await expect(
      updateProfile(17, { firstName: "Ірина", taxNumber: "1111111111" }),
    ).resolves.toEqual({ id: 4, firstName: "Ірина" });

    expect(findWorkerProfile).toHaveBeenCalledTimes(1);
    expect(profile.update).toHaveBeenCalledWith({
      firstName: "Ірина",
      taxNumber: "1111111111",
    });
  });
});

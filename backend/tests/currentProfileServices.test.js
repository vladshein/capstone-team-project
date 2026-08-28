import { jest } from "@jest/globals";

const findUser = jest.fn();

const User = { findOne: findUser };
const Company = {};
const WorkerProfile = {};

jest.unstable_mockModule("../db/models/index.js", () => ({
  User,
  Company,
  WorkerProfile,
}));

const { getCompanyProfile } = await import("../services/businessServices.js");
const { getWorkerProfile } = await import("../services/workerServices.js");

const accountAttributes = [
  "id",
  "email",
  "phone",
  "avatar",
  "isVerified",
  "role",
  "created_at",
];

describe("current business and worker profile services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns the current business user with all owned companies", async () => {
    const companies = [{ id: 11, name: "ТОВ «Зміна»" }];
    const user = {
      toJSON: jest.fn(() => ({
        id: 7,
        email: "business@example.com",
        role: "business_client",
        OwnedCompanies: companies,
      })),
    };
    findUser.mockResolvedValue(user);

    await expect(getCompanyProfile(7)).resolves.toEqual({
      id: 7,
      email: "business@example.com",
      role: "business_client",
      companies,
      profileCompleted: true,
    });

    expect(findUser).toHaveBeenCalledWith({
      where: { id: 7 },
      attributes: accountAttributes,
      include: {
        model: Company,
        as: "OwnedCompanies",
        attributes: ["id", "name", "edrpou", "legalAddress", "description", "avatar"],
        required: false,
      },
    });
  });

  test("treats a business account without companies as an incomplete but valid profile", async () => {
    findUser.mockResolvedValue({
      toJSON: () => ({ id: 7, OwnedCompanies: [] }),
    });

    await expect(getCompanyProfile(7)).resolves.toEqual({
      id: 7,
      companies: [],
      profileCompleted: false,
    });
  });

  test("returns a 404 when the requested business account does not exist", async () => {
    findUser.mockResolvedValue(null);

    await expect(getCompanyProfile(404)).rejects.toMatchObject({
      status: 404,
      message: "User not found",
    });
  });

  test("returns the current worker with their optional worker profile", async () => {
    const workerProfile = { id: 31, firstName: "Ірина", rating: "4.50" };
    const user = {
      WorkerProfile: workerProfile,
      toJSON: jest.fn(() => ({
        id: 8,
        email: "worker@example.com",
        role: "worker",
        WorkerProfile: workerProfile,
      })),
    };
    findUser.mockResolvedValue(user);

    await expect(getWorkerProfile(8)).resolves.toEqual({
      id: 8,
      email: "worker@example.com",
      role: "worker",
      WorkerProfile: workerProfile,
      profileCompleted: true,
    });

    expect(findUser).toHaveBeenCalledWith({
      where: { id: 8 },
      attributes: accountAttributes,
      include: {
        model: WorkerProfile,
        attributes: [
          "id",
          "firstName",
          "lastName",
          "birthDate",
          "taxNumber",
          "rating",
          "avatarUrl",
        ],
        required: false,
      },
    });
  });

  test("marks a worker account without a profile as incomplete instead of failing", async () => {
    findUser.mockResolvedValue({
      WorkerProfile: null,
      toJSON: () => ({ id: 8, WorkerProfile: null }),
    });

    await expect(getWorkerProfile(8)).resolves.toEqual({
      id: 8,
      WorkerProfile: null,
      profileCompleted: false,
    });
  });

  test("returns a 404 when the requested worker account does not exist", async () => {
    findUser.mockResolvedValue(null);

    await expect(getWorkerProfile(404)).rejects.toMatchObject({
      status: 404,
      message: "User not found",
    });
  });
});

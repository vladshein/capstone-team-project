import { jest } from "@jest/globals";

const findCompanyByPk = jest.fn();
const findCompanies = jest.fn();
const findCompany = jest.fn();
const createCompanyRecord = jest.fn();
const createLocationRecord = jest.fn();
const findReview = jest.fn();

const Company = {
  findByPk: findCompanyByPk,
  findAll: findCompanies,
  findOne: findCompany,
  create: createCompanyRecord,
};
const Location = { create: createLocationRecord };
const User = {};
const Shift = {};
const JobPosition = {};
const Category = {};
const Review = {
  findOne: findReview,
  sequelize: { fn: jest.fn(), col: jest.fn() },
};

jest.unstable_mockModule("../db/models/index.js", () => ({
  Company,
  Location,
  User,
  Shift,
  JobPosition,
  Category,
  Review,
}));

const {
  getCompanyById,
  getUserCompanies,
  createCompany,
  createCompanyLocation,
  updateCompany,
  deleteCompany,
} = await import("../services/companyServices.js");

const companyAttributes = [
  "id",
  "ownerId",
  "name",
  "description",
  "avatar",
  "created_at",
];
const locationAttributes = [
  "id",
  "title",
  "city",
  "address",
  "latitude",
  "longitude",
];

const createCompanyInstance = (overrides = {}) => ({
  id: 15,
  ownerId: 7,
  edrpou: "12345678",
  update: jest.fn().mockResolvedValue({ id: 15 }),
  destroy: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe("company services", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("gets a public company without exposing the owner phone number", async () => {
    const company = { id: 15, name: "Кав'ярня", ownerId: 7, setDataValue: jest.fn() };
    findCompanyByPk.mockResolvedValue(company);
    findReview.mockResolvedValue(null);

    await expect(getCompanyById(15)).resolves.toBe(company);

    expect(findCompanyByPk).toHaveBeenCalledWith(15, {
      attributes: companyAttributes,
      include: [{ model: Location, attributes: locationAttributes }],
    });
  });

  test("includes the owner phone only for an authenticated company lookup", async () => {
    findCompanyByPk.mockResolvedValue({ id: 15, ownerId: 7, setDataValue: jest.fn() });
    findReview.mockResolvedValue(null);

    await getCompanyById(15, { includePhone: true });

    expect(findCompanyByPk).toHaveBeenCalledWith(15, {
      attributes: companyAttributes,
      include: [
        { model: User, as: "Owner", attributes: ["phone"] },
        { model: Location, attributes: locationAttributes },
      ],
    });
  });

  test("returns a 404 when a requested company does not exist", async () => {
    findCompanyByPk.mockResolvedValue(null);

    await expect(getCompanyById(999)).rejects.toMatchObject({
      status: 404,
      message: "Компанію не знайдено",
    });
  });

  test("lists only the companies owned by the current business user", async () => {
    const companies = [{ id: 15 }, { id: 16 }];
    findCompanies.mockResolvedValue(companies);

    await expect(getUserCompanies(7)).resolves.toBe(companies);

    expect(findCompanies).toHaveBeenCalledWith({
      where: { ownerId: 7 },
      include: [{ model: Location, attributes: locationAttributes }],
      order: [["created_at", "DESC"]],
    });
  });

  test("creates a company for its owner when the EDRPOU is unique", async () => {
    const companyData = { name: "Кав'ярня", edrpou: "12345678" };
    const createdCompany = { id: 15, ownerId: 7, ...companyData };
    findCompany.mockResolvedValue(null);
    createCompanyRecord.mockResolvedValue(createdCompany);

    await expect(createCompany(7, companyData)).resolves.toBe(createdCompany);

    expect(findCompany).toHaveBeenCalledWith({ where: { edrpou: "12345678" } });
    expect(createCompanyRecord).toHaveBeenCalledWith({ ownerId: 7, ...companyData });
  });

  test("does not create a company with an existing EDRPOU", async () => {
    findCompany.mockResolvedValue({ id: 15, edrpou: "12345678" });

    await expect(
      createCompany(7, { name: "Ще одна", edrpou: "12345678" }),
    ).rejects.toMatchObject({
      status: 409,
      message: "Компанія з таким ЄДРПОУ вже зареєстрована в системі",
    });

    expect(createCompanyRecord).not.toHaveBeenCalled();
  });

  test("creates a location only when the current user owns the company", async () => {
    const company = { id: 15, ownerId: 7 };
    const locationData = { title: "Центр", city: "Київ" };
    const location = { id: 21, companyId: 15, ...locationData };
    findCompany.mockResolvedValue(company);
    createLocationRecord.mockResolvedValue(location);

    await expect(createCompanyLocation(15, 7, locationData)).resolves.toBe(location);

    expect(findCompany).toHaveBeenCalledWith({ where: { id: 15, ownerId: 7 } });
    expect(createLocationRecord).toHaveBeenCalledWith({ companyId: 15, ...locationData });
  });

  test("forbids creating a location for another user's company", async () => {
    findCompany.mockResolvedValue(null);

    await expect(
      createCompanyLocation(15, 8, { title: "Чужа локація" }),
    ).rejects.toMatchObject({
      status: 403,
      message: "У вас немає прав додавати локації цій компанії",
    });

    expect(createLocationRecord).not.toHaveBeenCalled();
  });

  test("returns 404 when updating a company that does not exist", async () => {
    findCompanyByPk.mockResolvedValue(null);

    await expect(updateCompany(999, 7, { name: "Оновлена" })).rejects.toMatchObject({
      status: 404,
      message: "Компанію не знайдено",
    });
  });

  test("forbids an owner from updating another user's company", async () => {
    const company = createCompanyInstance({ ownerId: 7 });
    findCompanyByPk.mockResolvedValue(company);

    await expect(updateCompany(15, 8, { name: "Чужа" })).rejects.toMatchObject({
      status: 403,
      message: "У вас немає прав на редагування цієї компанії",
    });

    expect(company.update).not.toHaveBeenCalled();
  });

  test("does not allow changing a company's EDRPOU to one used by another company", async () => {
    const company = createCompanyInstance({ edrpou: "12345678" });
    findCompanyByPk.mockResolvedValue(company);
    findCompany.mockResolvedValue({ id: 99, edrpou: "87654321" });

    await expect(updateCompany(15, 7, { edrpou: "87654321" })).rejects.toMatchObject({
      status: 409,
      message: "Цей ЄДРПОУ вже використовується іншою компанією",
    });

    expect(company.update).not.toHaveBeenCalled();
  });

  test("updates an owned company after validating a new unique EDRPOU", async () => {
    const updatedCompany = { id: 15, name: "Оновлена" };
    const company = createCompanyInstance({
      edrpou: "12345678",
      update: jest.fn().mockResolvedValue(updatedCompany),
    });
    findCompanyByPk.mockResolvedValue(company);
    findCompany.mockResolvedValue(null);

    await expect(
      updateCompany(15, 7, { name: "Оновлена", edrpou: "87654321" }),
    ).resolves.toBe(updatedCompany);

    expect(findCompany).toHaveBeenCalledWith({ where: { edrpou: "87654321" } });
    expect(company.update).toHaveBeenCalledWith({
      name: "Оновлена",
      edrpou: "87654321",
    });
  });

  test("returns 404 when deleting a company that does not exist", async () => {
    findCompanyByPk.mockResolvedValue(null);

    await expect(deleteCompany(999, 7)).rejects.toMatchObject({
      status: 404,
      message: "Компанію не знайдено",
    });
  });

  test("forbids deleting a company owned by another business user", async () => {
    const company = createCompanyInstance({ ownerId: 7 });
    findCompanyByPk.mockResolvedValue(company);

    await expect(deleteCompany(15, 8)).rejects.toMatchObject({
      status: 403,
      message: "У вас немає прав на видалення цієї компанії",
    });

    expect(company.destroy).not.toHaveBeenCalled();
  });

  test("deletes an owned company and reports success", async () => {
    const company = createCompanyInstance();
    findCompanyByPk.mockResolvedValue(company);

    await expect(deleteCompany(15, 7)).resolves.toEqual({ success: true });

    expect(company.destroy).toHaveBeenCalledTimes(1);
  });
});

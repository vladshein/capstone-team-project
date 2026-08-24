import { jest } from "@jest/globals";

const getCompanyById = jest.fn();
const getUserCompanies = jest.fn();
const createCompany = jest.fn();
const createCompanyLocation = jest.fn();
const updateCompany = jest.fn();
const deleteCompany = jest.fn();

jest.unstable_mockModule("../services/companyServices.js", () => ({
  getCompanyById,
  getUserCompanies,
  createCompany,
  createCompanyLocation,
  updateCompany,
  deleteCompany,
}));

const controller = await import("../controllers/companyControllers.js");

const createResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("company controllers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getCompanyById includes a phone number only for an authenticated requester", async () => {
    const company = { id: 12, name: "ТОВ «Зміна»" };
    getCompanyById.mockResolvedValue(company);
    const res = createResponse();

    await controller.getCompanyById(
      { params: { id: "12" }, user: { id: 4 } },
      res,
      jest.fn(),
    );

    expect(getCompanyById).toHaveBeenCalledWith("12", { includePhone: true });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Компанію успішно отримано",
      data: company,
    });
  });

  test("getCompanyById does not expose a phone number to a guest", async () => {
    getCompanyById.mockResolvedValue({ id: 12 });

    await controller.getCompanyById(
      { params: { id: "12" } },
      createResponse(),
      jest.fn(),
    );

    expect(getCompanyById).toHaveBeenCalledWith("12", { includePhone: false });
  });

  test("forwards a company-service error to Express error middleware", async () => {
    const error = new Error("Компанію не знайдено");
    const next = jest.fn();
    getCompanyById.mockRejectedValue(error);

    await controller.getCompanyById(
      { params: { id: "404" } },
      createResponse(),
      next,
    );

    expect(next).toHaveBeenCalledWith(error);
  });

  test("returns companies owned by the authenticated business user", async () => {
    const companies = [{ id: 1 }, { id: 2 }];
    getUserCompanies.mockResolvedValue(companies);
    const res = createResponse();

    await controller.getMyCompanies({ user: { id: 7 } }, res, jest.fn());

    expect(getUserCompanies).toHaveBeenCalledWith(7);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Компанії успішно отримано",
      data: companies,
    });
  });

  test("creates a company for a business client and forwards the validated body", async () => {
    const body = { name: "ТОВ «Зміна»", edrpou: "12345678" };
    const company = { id: 3, ...body };
    createCompany.mockResolvedValue(company);
    const res = createResponse();

    await controller.createCompany(
      { user: { id: 7, role: "business_client" }, body },
      res,
      jest.fn(),
    );

    expect(createCompany).toHaveBeenCalledWith(7, body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Компанію успішно додано",
      data: company,
    });
  });

  test("rejects company creation by a non-business user before calling the service", async () => {
    const next = jest.fn();

    await controller.createCompany(
      { user: { id: 7, role: "worker" }, body: {} },
      createResponse(),
      next,
    );

    expect(createCompany).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Тільки бізнес-клієнти можуть створювати компанії",
        status: 403,
      }),
    );
  });

  test("parses the company id for a new work location", async () => {
    const body = { city: "Вінниця", address: "вул. Соборна, 1" };
    const location = { id: 14, ...body };
    createCompanyLocation.mockResolvedValue(location);
    const res = createResponse();

    await controller.createCompanyLocation(
      { params: { id: "12" }, user: { id: 7 }, body },
      res,
      jest.fn(),
    );

    expect(createCompanyLocation).toHaveBeenCalledWith(12, 7, body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Робочу локацію успішно додано",
      data: location,
    });
  });

  test("forwards update and delete identifiers, owner and body to the service layer", async () => {
    const body = { name: "Оновлена компанія" };
    const updated = { id: 12, ...body };
    updateCompany.mockResolvedValue(updated);
    const updateResponse = createResponse();

    await controller.updateCompany(
      { params: { id: "12" }, user: { id: 7 }, body },
      updateResponse,
      jest.fn(),
    );

    expect(updateCompany).toHaveBeenCalledWith("12", 7, body);
    expect(updateResponse.json).toHaveBeenCalledWith({
      message: "Дані компанії успішно оновлено",
      data: updated,
    });

    const deleteResponse = createResponse();
    await controller.deleteCompany(
      { params: { id: "12" }, user: { id: 7 } },
      deleteResponse,
      jest.fn(),
    );

    expect(deleteCompany).toHaveBeenCalledWith("12", 7);
    expect(deleteResponse.status).toHaveBeenCalledWith(200);
    expect(deleteResponse.json).toHaveBeenCalledWith({
      message: "Компанію та всі пов'язані з нею дані успішно видалено",
    });
  });
});

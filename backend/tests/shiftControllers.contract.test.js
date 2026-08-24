import { jest } from "@jest/globals";

const getAllShifts = jest.fn();
const getShiftMapMarkers = jest.fn();
const getShiftById = jest.fn();
const getBusinessShifts = jest.fn();
const getBusinessShiftApplications = jest.fn();
const getPendingBusinessShiftApplicationsCount = jest.fn();
const getBusinessShiftWorkerSummary = jest.fn();
const decideBusinessShiftApplication = jest.fn();
const completeBusinessShiftApplication = jest.fn();
const markBusinessShiftApplicationNoShow = jest.fn();
const verifyLocationOwnership = jest.fn();
const createShift = jest.fn();
const findShiftApplication = jest.fn();
const createShiftApplication = jest.fn();
const cancelWorkerShiftApplication = jest.fn();
const updateShift = jest.fn();
const cancelShift = jest.fn();
const getWorkerShiftHistory = jest.fn();

jest.unstable_mockModule("../services/shiftServices.js", () => ({
  getAllShifts,
  getShiftMapMarkers,
  getShiftById,
  getBusinessShifts,
  getBusinessShiftApplications,
  getPendingBusinessShiftApplicationsCount,
  getBusinessShiftWorkerSummary,
  decideBusinessShiftApplication,
  completeBusinessShiftApplication,
  markBusinessShiftApplicationNoShow,
  verifyLocationOwnership,
  createShift,
  findShiftApplication,
  createShiftApplication,
  cancelWorkerShiftApplication,
  updateShift,
  cancelShift,
  getWorkerShiftHistory,
}));

const shiftController = await import("../controllers/shiftControllers.js");

const createResponse = () => {
  const response = {};
  response.status = jest.fn().mockReturnValue(response);
  response.json = jest.fn().mockReturnValue(response);
  response.set = jest.fn().mockReturnValue(response);
  return response;
};

const ownerShift = ({ status = "open", startTime = "2035-01-01T10:00:00.000Z" } = {}) => ({
  id: 15,
  status,
  startTime,
  Location: { Company: { ownerId: 7 } },
});

describe("shift controllers: HTTP contracts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("normalizes list filters, page and limit before loading shifts", async () => {
    const result = { data: [], totalItems: 0 };
    getAllShifts.mockResolvedValue(result);
    const response = createResponse();
    const next = jest.fn();

    await shiftController.getAllShifts(
      {
        query: {
          page: "-3",
          limit: "1000",
          categoryIds: " 1, 2 ,,3 ",
          partners: ["Alpha", " Beta "],
          city: "  Київ  ",
          dateFrom: "2035-01-01T00:00:00.000Z",
          dateTo: "not-a-date",
          durationFilters: "До 4 год,4–8 год",
          sort: "unknown",
          latitude: "50.45",
          longitude: "30.52",
          radiusKm: "99",
        },
      },
      response,
      next,
    );

    expect(getAllShifts).toHaveBeenCalledWith({
      page: 1,
      limit: 100,
      minPrice: undefined,
      maxPrice: undefined,
      categoryId: undefined,
      categoryIds: ["1", "2", "3"],
      partners: ["Alpha", "Beta"],
      city: "Київ",
      dateFrom: "2035-01-01T00:00:00.000Z",
      dateTo: undefined,
      durationFilters: ["До 4 год", "4–8 год"],
      sort: "relevance",
      latitude: 50.45,
      longitude: 30.52,
      radiusKm: 50,
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(result);
    expect(next).not.toHaveBeenCalled();
  });

  test("requires a city or a complete radius search before requesting map markers", async () => {
    const response = createResponse();

    await shiftController.getShiftMapMarkers({ query: { latitude: "50.45" } }, response, jest.fn());

    expect(getShiftMapMarkers).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      message: "Для карти потрібно визначити місто або локацію користувача.",
    });
  });

  test("passes normalized radius filters to the map service", async () => {
    const result = { data: [{ id: 15 }], isTruncated: false, partnerOptions: [] };
    getShiftMapMarkers.mockResolvedValue(result);
    const response = createResponse();

    await shiftController.getShiftMapMarkers(
      {
        query: {
          latitude: "50.45",
          longitude: "30.52",
          radiusKm: "0",
          sort: "nearest",
          partners: "Coffee Point",
        },
      },
      response,
      jest.fn(),
    );

    expect(getShiftMapMarkers).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: 50.45,
        longitude: 30.52,
        radiusKm: 1,
        sort: "nearest",
        partners: ["Coffee Point"],
      }),
    );
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(result);
  });

  test("creates an open shift only after confirming location ownership", async () => {
    const newShift = { id: 15, status: "open" };
    verifyLocationOwnership.mockResolvedValue(12);
    createShift.mockResolvedValue(newShift);
    const response = createResponse();

    await shiftController.createShift(
      {
        user: { id: 7 },
        body: {
          locationId: 44,
          positionId: 8,
          categoryId: 3,
          startTime: "2035-01-01T10:00:00.000Z",
          endTime: "2035-01-01T18:00:00.000Z",
          hourlyRate: 250,
          description: "Допомога в залі",
        },
      },
      response,
      jest.fn(),
    );

    expect(verifyLocationOwnership).toHaveBeenCalledWith(44, 7);
    expect(createShift).toHaveBeenCalledWith({
      locationId: 44,
      positionId: 8,
      categoryId: 3,
      startTime: "2035-01-01T10:00:00.000Z",
      endTime: "2035-01-01T18:00:00.000Z",
      hourlyRate: 250,
      bonusRate: 0,
      description: "Допомога в залі",
      status: "open",
    });
    expect(response.status).toHaveBeenCalledWith(201);
  });

  test("rejects a shift creation attempt for an unowned location", async () => {
    verifyLocationOwnership.mockResolvedValue(false);
    const next = jest.fn();

    await shiftController.createShift(
      {
        user: { id: 8 },
        body: {
          locationId: 44,
          startTime: "2035-01-01T10:00:00.000Z",
        },
      },
      createResponse(),
      next,
    );

    expect(createShift).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "У вас немає прав створювати зміну на цій локації.",
        status: 403,
      }),
    );
  });

  test("maps a successful business decision to a no-store response", async () => {
    const application = { id: 91, status: "approved" };
    decideBusinessShiftApplication.mockResolvedValue({ application, reason: null });
    const response = createResponse();

    await shiftController.decideBusinessShiftApplication(
      { params: { applicationId: "91" }, body: { status: "approved" }, user: { id: 7 } },
      response,
      jest.fn(),
    );

    expect(decideBusinessShiftApplication).toHaveBeenCalledWith({
      applicationId: 91,
      ownerId: 7,
      decision: "approved",
    });
    expect(response.set).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      message: "Заявку підтверджено.",
      data: application,
    });
  });

  test("returns an unavailable response when a decision arrives too late", async () => {
    decideBusinessShiftApplication.mockResolvedValue({ application: null, reason: "unavailable" });
    const response = createResponse();

    await shiftController.decideBusinessShiftApplication(
      { params: { applicationId: "91" }, body: { status: "approved" }, user: { id: 7 } },
      response,
      jest.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      message: "Зміна вже недоступна для призначення виконавця.",
    });
  });

  test("maps worker cancellation reasons to a client error", async () => {
    cancelWorkerShiftApplication.mockResolvedValue({ application: null, reason: "started" });
    const next = jest.fn();

    await shiftController.cancelWorkerApplication(
      { params: { applicationId: "91" }, user: { id: 42 } },
      createResponse(),
      next,
    );

    expect(cancelWorkerShiftApplication).toHaveBeenCalledWith(91, 42);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Не можна скасувати заявку після початку зміни.",
        status: 400,
      }),
    );
  });

  test("cancels an owned future shift and returns the updated item", async () => {
    const shift = ownerShift();
    const cancelled = { ...shift, status: "cancelled" };
    getShiftById.mockResolvedValue(shift);
    cancelShift.mockResolvedValue(cancelled);
    const response = createResponse();

    await shiftController.cancelShift(
      { params: { id: "15" }, user: { id: 7 } },
      response,
      jest.fn(),
    );

    expect(cancelShift).toHaveBeenCalledWith("15");
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      message: "Зміну успішно скасовано",
      data: cancelled,
    });
  });

  test("does not cancel a shift owned by another company", async () => {
    getShiftById.mockResolvedValue({
      ...ownerShift(),
      Location: { Company: { ownerId: 8 } },
    });
    const next = jest.fn();

    await shiftController.cancelShift(
      { params: { id: "15" }, user: { id: 7 } },
      createResponse(),
      next,
    );

    expect(cancelShift).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "У вас немає прав на скасування цієї зміни.",
        status: 403,
      }),
    );
  });

  test("serves a business application summary without loading the full list", async () => {
    getPendingBusinessShiftApplicationsCount.mockResolvedValue(3);
    const response = createResponse();

    await shiftController.getBusinessShiftApplications(
      { query: { companyId: "12", summary: "true", page: "-4", limit: "99" }, user: { id: 7 } },
      response,
      jest.fn(),
    );

    expect(getPendingBusinessShiftApplicationsCount).toHaveBeenCalledWith({
      companyId: 12,
      ownerId: 7,
      page: 1,
      limit: 50,
    });
    expect(getBusinessShiftApplications).not.toHaveBeenCalled();
    expect(response.set).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(response.json).toHaveBeenCalledWith({ pendingCount: 3 });
  });
});

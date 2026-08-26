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
const createShifts = jest.fn();
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
  createShifts,
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

  test("creates one shift for each day in a requested series", async () => {
    verifyLocationOwnership.mockResolvedValue(12);
    createShifts.mockResolvedValue([{ id: 15 }, { id: 16 }, { id: 17 }]);
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
          repeatDays: 3,
        },
      },
      response,
      jest.fn(),
    );

    expect(createShifts).toHaveBeenCalledWith([
      expect.objectContaining({ startTime: new Date("2035-01-01T10:00:00.000Z"), endTime: new Date("2035-01-01T18:00:00.000Z") }),
      expect.objectContaining({ startTime: new Date("2035-01-02T10:00:00.000Z"), endTime: new Date("2035-01-02T18:00:00.000Z") }),
      expect.objectContaining({ startTime: new Date("2035-01-03T10:00:00.000Z"), endTime: new Date("2035-01-03T18:00:00.000Z") }),
    ]);
    expect(createShift).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ createdCount: 3 }));
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

  test("updates an owned open shift that has not started", async () => {
    const shift = ownerShift();
    const updated = { ...shift, description: "Оновлений опис" };
    getShiftById.mockResolvedValue(shift);
    updateShift.mockResolvedValue(updated);
    const response = createResponse();

    await shiftController.updateShift(
      {
        params: { id: "15" },
        user: { id: 7 },
        body: { description: "Оновлений опис", hourlyRate: 280 },
      },
      response,
      jest.fn(),
    );

    expect(updateShift).toHaveBeenCalledWith("15", {
      description: "Оновлений опис",
      hourlyRate: 280,
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      message: "Зміну успішно оновлено",
      data: updated,
    });
  });

  test("does not update a shift owned by another company", async () => {
    getShiftById.mockResolvedValue({
      ...ownerShift(),
      Location: { Company: { ownerId: 8 } },
    });
    const next = jest.fn();

    await shiftController.updateShift(
      { params: { id: "15" }, user: { id: 7 }, body: { hourlyRate: 280 } },
      createResponse(),
      next,
    );

    expect(updateShift).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "У вас немає прав на редагування цієї зміни.",
        status: 403,
      }),
    );
  });

  test("does not update a shift that is no longer open", async () => {
    getShiftById.mockResolvedValue(ownerShift({ status: "booked" }));
    const next = jest.fn();

    await shiftController.updateShift(
      { params: { id: "15" }, user: { id: 7 }, body: { hourlyRate: 280 } },
      createResponse(),
      next,
    );

    expect(updateShift).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Не можна редагувати зміну, яка вже заброньована робітником або завершена.",
        status: 400,
      }),
    );
  });

  test("does not update a shift after its original start time", async () => {
    getShiftById.mockResolvedValue(ownerShift({ startTime: "2020-01-01T10:00:00.000Z" }));
    const next = jest.fn();

    await shiftController.updateShift(
      { params: { id: "15" }, user: { id: 7 }, body: { hourlyRate: 280 } },
      createResponse(),
      next,
    );

    expect(updateShift).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Не можна редагувати зміну після її початку.",
        status: 400,
      }),
    );
  });

  test("does not move an editable shift to a start time in the past", async () => {
    getShiftById.mockResolvedValue(ownerShift());
    const next = jest.fn();

    await shiftController.updateShift(
      {
        params: { id: "15" },
        user: { id: 7 },
        body: { startTime: "2020-01-01T10:00:00.000Z" },
      },
      createResponse(),
      next,
    );

    expect(updateShift).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Час початку зміни має бути в майбутньому.",
        status: 400,
      }),
    );
  });

  test("returns not found when cancelling a missing shift", async () => {
    getShiftById.mockResolvedValue(null);
    const next = jest.fn();

    await shiftController.cancelShift(
      { params: { id: "15" }, user: { id: 7 } },
      createResponse(),
      next,
    );

    expect(cancelShift).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Зміну не знайдено.", status: 404 }),
    );
  });

  test("does not cancel a final shift", async () => {
    getShiftById.mockResolvedValue(ownerShift({ status: "completed" }));
    const next = jest.fn();

    await shiftController.cancelShift(
      { params: { id: "15" }, user: { id: 7 } },
      createResponse(),
      next,
    );

    expect(cancelShift).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Цю зміну не можна скасувати, вона вже завершена або скасована раніше.",
        status: 400,
      }),
    );
  });

  test("does not cancel a shift after its start time", async () => {
    getShiftById.mockResolvedValue(ownerShift({ startTime: "2020-01-01T10:00:00.000Z" }));
    const next = jest.fn();

    await shiftController.cancelShift(
      { params: { id: "15" }, user: { id: 7 } },
      createResponse(),
      next,
    );

    expect(cancelShift).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Не можна скасувати зміну після її початку.",
        status: 400,
      }),
    );
  });

  test("maps missing worker applications to a not-found response", async () => {
    cancelWorkerShiftApplication.mockResolvedValue({ application: null, reason: "not_found" });
    const next = jest.fn();

    await shiftController.cancelWorkerApplication(
      { params: { applicationId: "91" }, user: { id: 42 } },
      createResponse(),
      next,
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Заявку не знайдено.", status: 404 }),
    );
  });

  test("maps applications with a final status to a cancellation error", async () => {
    cancelWorkerShiftApplication.mockResolvedValue({ application: null, reason: "status" });
    const next = jest.fn();

    await shiftController.cancelWorkerApplication(
      { params: { applicationId: "91" }, user: { id: 42 } },
      createResponse(),
      next,
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Цю заявку вже не можна скасувати.",
        status: 400,
      }),
    );
  });

  test("returns a success message after a worker withdraws a pending application", async () => {
    cancelWorkerShiftApplication.mockResolvedValue({ application: { id: 91 }, reason: null });
    const response = createResponse();

    await shiftController.cancelWorkerApplication(
      { params: { applicationId: "91" }, user: { id: 42 } },
      response,
      jest.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ message: "Заявку скасовано." });
  });

  test("normalizes worker history query parameters and returns the service result", async () => {
    const result = { totalItems: 1, totalPages: 1, currentPage: 2, data: [{ id: 91 }] };
    getWorkerShiftHistory.mockResolvedValue(result);
    const response = createResponse();

    await shiftController.getWorkerShifts(
      {
        user: { id: 42 },
        query: {
          page: "2",
          limit: "8",
          status: "approved",
          shiftId: "15",
          scope: "completed",
        },
      },
      response,
      jest.fn(),
    );

    expect(getWorkerShiftHistory).toHaveBeenCalledWith(42, {
      page: 2,
      limit: 8,
      status: "approved",
      shiftId: 15,
      scope: "completed",
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      message: "Історію робіт успішно отримано",
      ...result,
    });
  });

  test("falls back to the active worker history scope for an unsupported value", async () => {
    getWorkerShiftHistory.mockResolvedValue({ totalItems: 0, data: [] });

    await shiftController.getWorkerShifts(
      { user: { id: 42 }, query: { scope: "all" } },
      createResponse(),
      jest.fn(),
    );

    expect(getWorkerShiftHistory).toHaveBeenCalledWith(42, {
      page: 1,
      limit: 10,
      status: undefined,
      shiftId: undefined,
      scope: "active",
    });
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

import { jest } from "@jest/globals";

const getShiftById = jest.fn();
const findShiftApplication = jest.fn();
const createShiftApplication = jest.fn();

jest.unstable_mockModule("../services/shiftServices.js", () => ({
  getShiftById,
  findShiftApplication,
  createShiftApplication,
}));

const { applyToShift } = await import("../controllers/shiftControllers.js");

const createResponse = () => {
  const response = {};
  response.status = jest.fn().mockReturnValue(response);
  response.json = jest.fn().mockReturnValue(response);
  return response;
};

describe("applyToShift controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("creates a pending application for an open future shift", async () => {
    const application = { id: 91, shiftId: 15, workerId: 42, status: "pending" };
    getShiftById.mockResolvedValue({
      id: 15,
      status: "open",
      startTime: "2035-01-01T10:00:00.000Z",
    });
    findShiftApplication.mockResolvedValue(null);
    createShiftApplication.mockResolvedValue(application);
    const response = createResponse();
    const next = jest.fn();

    await applyToShift({ params: { id: "15" }, user: { id: 42 } }, response, next);

    expect(createShiftApplication).toHaveBeenCalledWith(15, 42);
    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith({
      message: "Відгук на зміну надіслано.",
      data: application,
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("does not create a duplicate application", async () => {
    getShiftById.mockResolvedValue({
      id: 15,
      status: "open",
      startTime: "2035-01-01T10:00:00.000Z",
    });
    findShiftApplication.mockResolvedValue({ id: 90 });
    const response = createResponse();
    const next = jest.fn();

    await applyToShift({ params: { id: "15" }, user: { id: 42 } }, response, next);

    expect(createShiftApplication).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Ви вже відгукнулися на цю зміну.",
        status: 409,
      }),
    );
  });

  test("does not allow applications to a non-open shift", async () => {
    getShiftById.mockResolvedValue({
      id: 15,
      status: "booked",
      startTime: "2035-01-01T10:00:00.000Z",
    });
    const next = jest.fn();

    await applyToShift(
      { params: { id: "15" }, user: { id: 42 } },
      createResponse(),
      next,
    );

    expect(findShiftApplication).not.toHaveBeenCalled();
    expect(createShiftApplication).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "На цю зміну вже не можна відгукнутися.",
        status: 400,
      }),
    );
  });

  test("does not allow applications after the shift has started", async () => {
    getShiftById.mockResolvedValue({
      id: 15,
      status: "open",
      startTime: "2020-01-01T10:00:00.000Z",
    });
    const next = jest.fn();

    await applyToShift(
      { params: { id: "15" }, user: { id: 42 } },
      createResponse(),
      next,
    );

    expect(findShiftApplication).not.toHaveBeenCalled();
    expect(createShiftApplication).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Відгукнутися можна лише до початку зміни.",
        status: 400,
      }),
    );
  });

  test("returns a not-found error before attempting to create an application", async () => {
    getShiftById.mockResolvedValue(null);
    const next = jest.fn();

    await applyToShift(
      { params: { id: "404" }, user: { id: 42 } },
      createResponse(),
      next,
    );

    expect(findShiftApplication).not.toHaveBeenCalled();
    expect(createShiftApplication).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Зміну не знайдено.", status: 404 }),
    );
  });
});

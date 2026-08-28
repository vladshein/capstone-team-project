import { jest } from "@jest/globals";

const getApproximateLocation = jest.fn();
const getCityByCoordinates = jest.fn();

jest.unstable_mockModule("../services/locationServices.js", () => ({
  getApproximateLocation,
  getCityByCoordinates,
}));

const {
  getApproximateLocationByIp,
  getCityByCoordinatesController,
} = await import("../controllers/locationControllers.js");

const createResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("location controllers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("uses Express request IP and returns the approximate location", async () => {
    const location = { city: "Вінниця", latitude: 49.23, longitude: 28.48 };
    getApproximateLocation.mockResolvedValue(location);
    const res = createResponse();

    await getApproximateLocationByIp({ ip: "203.0.113.7" }, res, jest.fn());

    expect(getApproximateLocation).toHaveBeenCalledWith("203.0.113.7");
    expect(res.json).toHaveBeenCalledWith(location);
  });

  test("returns the documented unavailable location shape when IP lookup has no result", async () => {
    getApproximateLocation.mockResolvedValue(null);
    const res = createResponse();

    await getApproximateLocationByIp({ ip: "203.0.113.7" }, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith({
      city: null,
      region: null,
      country: null,
      latitude: null,
      longitude: null,
      accuracy: "unavailable",
    });
  });

  test("forwards an IP geolocation failure", async () => {
    const error = new Error("service unavailable");
    const next = jest.fn();
    getApproximateLocation.mockRejectedValue(error);

    await getApproximateLocationByIp({ ip: "203.0.113.7" }, createResponse(), next);

    expect(next).toHaveBeenCalledWith(error);
  });

  test("parses query coordinates and returns a resolved city", async () => {
    const location = { city: "Київ" };
    getCityByCoordinates.mockResolvedValue(location);
    const res = createResponse();

    await getCityByCoordinatesController(
      { query: { latitude: "50.4501", longitude: "30.5234" } },
      res,
      jest.fn(),
    );

    expect(getCityByCoordinates).toHaveBeenCalledWith(50.4501, 30.5234);
    expect(res.json).toHaveBeenCalledWith(location);
  });

  test.each([
    [{ latitude: "not-a-number", longitude: "30" }],
    [{ latitude: "91", longitude: "30" }],
    [{ latitude: "50", longitude: "181" }],
  ])("rejects invalid reverse-geocoding coordinates: %o", async (query) => {
    const res = createResponse();

    await getCityByCoordinatesController({ query }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Передано некоректні координати." });
    expect(getCityByCoordinates).not.toHaveBeenCalled();
  });

  test("returns a null city when reverse geocoding has no match", async () => {
    getCityByCoordinates.mockResolvedValue(null);
    const res = createResponse();

    await getCityByCoordinatesController(
      { query: { latitude: "50", longitude: "30" } },
      res,
      jest.fn(),
    );

    expect(res.json).toHaveBeenCalledWith({ city: null });
  });
});

import { jest } from "@jest/globals";

const originalFetch = global.fetch;
const originalNodeEnv = process.env.NODE_ENV;

const { getApproximateLocation, getCityByCoordinates } =
  await import("../services/locationServices.js");

const jsonResponse = (body, ok = true) => ({
  ok,
  json: jest.fn().mockResolvedValue(body),
});

describe("location services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    process.env.NODE_ENV = "test";
  });

  afterAll(() => {
    global.fetch = originalFetch;

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  test("does not call the IP service for a private client address outside development", async () => {
    await expect(getApproximateLocation("192.168.1.10")).resolves.toBeNull();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("uses the development egress-IP fallback and caches it for private addresses", async () => {
    process.env.NODE_ENV = "development";
    global.fetch.mockResolvedValueOnce(
      jsonResponse({
        city: "Київ",
        region: "Київ",
        country_code: "UA",
      }),
    );

    const firstLocation = await getApproximateLocation("172.20.0.15");
    const secondLocation = await getApproximateLocation("10.0.0.7");

    expect(firstLocation).toEqual({
      city: "Київ",
      region: "Київ",
      country: "UA",
      latitude: null,
      longitude: null,
      accuracy: "city",
    });
    expect(secondLocation).toBe(firstLocation);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith("https://ipapi.co/json/", {
      headers: { "User-Agent": "Zmina.ua/1.0" },
    });
  });

  test("returns the IP-based city when reverse geocoding is temporarily unavailable", async () => {
    global.fetch
      .mockResolvedValueOnce(
        jsonResponse({
          city: "Kiev",
          region: "Kyiv City",
          country_code: "UA",
          latitude: 50.4501,
          longitude: 30.5234,
        }),
      )
      .mockRejectedValueOnce(new Error("reverse geocoder unavailable"));

    await expect(getApproximateLocation("198.51.100.12")).resolves.toEqual({
      city: "Kiev",
      region: "Kyiv City",
      country: "UA",
      latitude: 50.4501,
      longitude: 30.5234,
      accuracy: "city",
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "https://ipapi.co/198.51.100.12/json/",
      { headers: { "User-Agent": "Zmina.ua/1.0" } },
    );
  });

  test("caches a public IP lookup when it has no usable coordinates for reverse geocoding", async () => {
    global.fetch.mockResolvedValueOnce(
      jsonResponse({
        city: "Одеса",
        region: "Одеська область",
        country_code: "UA",
      }),
    );

    const firstLocation = await getApproximateLocation("198.51.100.20");
    const secondLocation = await getApproximateLocation("198.51.100.20");

    expect(secondLocation).toBe(firstLocation);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("throws a clear error when the IP provider returns an unsuccessful response", async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse({}, false));

    await expect(getApproximateLocation("198.51.100.30")).rejects.toThrow(
      "Не вдалося визначити місто за IP-адресою.",
    );
  });

  test("surfaces the reason supplied by an IP provider error response", async () => {
    global.fetch.mockResolvedValueOnce(
      jsonResponse({ error: true, reason: "IP address is invalid" }),
    );

    await expect(getApproximateLocation("198.51.100.31")).rejects.toThrow(
      "IP address is invalid",
    );
  });

  test("rejects invalid reverse-geocoding coordinates without a network call", async () => {
    await expect(getCityByCoordinates(Number.NaN, 30.5234)).resolves.toBeNull();
    await expect(getCityByCoordinates(50.4501, Infinity)).resolves.toBeNull();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("uses a town fallback from reverse geocoding and caches rounded coordinates", async () => {
    global.fetch.mockResolvedValueOnce(
      jsonResponse({ address: { town: "Львів" } }),
    );

    const firstLocation = await getCityByCoordinates(49.8397, 24.0297);
    const secondLocation = await getCityByCoordinates(49.8399, 24.0299);

    expect(firstLocation).toEqual({ city: "Львів" });
    expect(secondLocation).toBe(firstLocation);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("https://nominatim.openstreetmap.org/reverse?"),
      {
        headers: {
          "User-Agent": "Zmina.ua/1.0",
          "Accept-Language": "uk",
        },
      },
    );
  });

  test("throws a clear error when reverse geocoding returns an unsuccessful response", async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse({}, false));

    await expect(getCityByCoordinates(51.111, 31.111)).rejects.toThrow(
      "Не вдалося визначити місто за координатами.",
    );
  });
});

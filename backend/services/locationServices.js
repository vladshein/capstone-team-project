const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const locationCache = new Map();

const isPrivateIp = (ip) => {
  const normalizedIp = ip?.replace(/^::ffff:/, "");

  return (
    !normalizedIp ||
    normalizedIp === "::1" ||
    normalizedIp === "127.0.0.1" ||
    normalizedIp.startsWith("10.") ||
    normalizedIp.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(normalizedIp)
  );
};

export const getApproximateLocation = async (ip) => {
  // У локальному Docker req.ip — це адреса внутрішньої мережі (172.x.x.x),
  // тому для dev визначаємо місто за зовнішньою IP-адресою самого хоста.
  // У production не робимо цього fallback: там важлива IP саме відвідувача.
  const useServerEgressIp = isPrivateIp(ip) && process.env.NODE_ENV === "development";
  if (isPrivateIp(ip) && !useServerEgressIp) return null;

  const cacheKey = useServerEgressIp ? "development-egress-ip" : ip;
  const cached = locationCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.location;

  const endpoint = useServerEgressIp
    ? "https://ipapi.co/json/"
    : `https://ipapi.co/${encodeURIComponent(ip)}/json/`;
  const response = await fetch(endpoint, {
    headers: { "User-Agent": "Zmina.ua/1.0" },
  });

  if (!response.ok) {
    throw new Error("Не вдалося визначити місто за IP-адресою.");
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.reason ?? "Не вдалося визначити місто за IP-адресою.");
  }

  let city = data.city ?? null;
  const latitude = Number(data.latitude);
  const longitude = Number(data.longitude);

  // IP-сервіс часто повертає транслітеровані назви міст. Уточнюємо назву за
  // координатами з українською локалізацією, але не ламаємо IP-fallback, якщо
  // зовнішній reverse-geocoding тимчасово недоступний.
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    try {
      const preciseLocation = await getCityByCoordinates(latitude, longitude);
      city = preciseLocation?.city ?? city;
    } catch {
      // Залишаємо назву, яку повернув IP-сервіс.
    }
  }

  const location = {
    city,
    region: data.region ?? null,
    country: data.country_code ?? data.country ?? null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    accuracy: "city",
  };

  locationCache.set(cacheKey, { location, expiresAt: Date.now() + CACHE_TTL_MS });
  return location;
};

export const getCityByCoordinates = async (latitude, longitude) => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  // Округлення до ~110 м дає змогу не звертатися до сервісу повторно, коли
  // браузер повертає трохи інші координати тієї самої точки.
  const cacheKey = `reverse:${latitude.toFixed(3)}:${longitude.toFixed(3)}`;
  const cached = locationCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.location;

  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    zoom: "10",
    addressdetails: "1",
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
    headers: {
      "User-Agent": "Zmina.ua/1.0",
      "Accept-Language": "uk",
    },
  });

  if (!response.ok) {
    throw new Error("Не вдалося визначити місто за координатами.");
  }

  const { address = {} } = await response.json();
  const location = {
    city:
      address.city ??
      address.town ??
      address.village ??
      address.municipality ??
      null,
  };

  locationCache.set(cacheKey, { location, expiresAt: Date.now() + CACHE_TTL_MS });
  return location;
};

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

  const location = {
    city: data.city ?? null,
    region: data.region ?? null,
    country: data.country_code ?? data.country ?? null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    accuracy: "city",
  };

  locationCache.set(cacheKey, { location, expiresAt: Date.now() + CACHE_TTL_MS });
  return location;
};

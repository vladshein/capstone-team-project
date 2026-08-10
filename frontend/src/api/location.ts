import api from "./client";

export interface ApproximateLocation {
  city: string | null;
  region: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: "city" | "unavailable";
}

export async function getApproximateLocation(): Promise<ApproximateLocation> {
  const { data } = await api.get<ApproximateLocation>("/location/approx");
  return data;
}

export async function getCityByCoordinates(
  latitude: number,
  longitude: number,
): Promise<{ city: string | null }> {
  const { data } = await api.get<{ city: string | null }>("/location/reverse", {
    params: { latitude, longitude },
  });
  return data;
}

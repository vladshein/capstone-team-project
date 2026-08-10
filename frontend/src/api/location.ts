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

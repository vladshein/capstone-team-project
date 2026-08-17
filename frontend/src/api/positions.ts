import api from "./client";

export interface JobPositionOption {
  id: number;
  title: string;
  categoryId: string;
}

export async function getJobPositions(): Promise<JobPositionOption[]> {
  const { data } = await api.get<JobPositionOption[]>("/positions");
  return data;
}

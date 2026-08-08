import api from "./axiosInstance";

export interface Category {
  id: string | number;
  name: string;
}

export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/categories");
  return data;
}

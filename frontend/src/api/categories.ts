import api from "./client";

export interface Category {
  id: string | number;
  name: string;
}

export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/categories");
  return data;
}

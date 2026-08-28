import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "zmina.favorite-company-ids";
const LEGACY_STORAGE_KEY = "zmina.favorite-companies";
const UPDATE_EVENT = "zmina:favorite-companies-updated";

const readFavorites = (): number[] => {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
    const parsed: unknown = value ? JSON.parse(value) : [];
    if (!Array.isArray(parsed)) return [];

    return [...new Set(parsed.map((item) => {
      if (typeof item === "object" && item !== null && "id" in item) return Number(item.id);
      return Number(item);
    }).filter((id) => Number.isInteger(id) && id > 0))];
  } catch {
    return [];
  }
};

export function useFavoriteCompanies() {
  const [favoriteIds, setFavoriteIds] = useState<number[]>(readFavorites);

  useEffect(() => {
    const syncFavorites = () => setFavoriteIds(readFavorites());
    window.addEventListener("storage", syncFavorites);
    window.addEventListener(UPDATE_EVENT, syncFavorites);

    return () => {
      window.removeEventListener("storage", syncFavorites);
      window.removeEventListener(UPDATE_EVENT, syncFavorites);
    };
  }, []);

  const saveFavorites = useCallback((companyIds: number[]) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(companyIds));
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      window.dispatchEvent(new Event(UPDATE_EVENT));
    } catch {
      // Якщо localStorage недоступний, вибір не збережеться між сесіями.
    }
  }, []);

  const toggleFavorite = useCallback((companyId: number) => {
    const currentFavorites = readFavorites();
    saveFavorites(
      currentFavorites.includes(companyId)
        ? currentFavorites.filter((id) => id !== companyId)
        : [companyId, ...currentFavorites],
    );
  }, [saveFavorites]);

  const removeFavorite = useCallback((companyId: number) => {
    saveFavorites(readFavorites().filter((id) => id !== companyId));
  }, [saveFavorites]);

  return {
    favoriteIds,
    isFavorite: (companyId: number) => favoriteIds.includes(companyId),
    toggleFavorite,
    removeFavorite,
  };
}

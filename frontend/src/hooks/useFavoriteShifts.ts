import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "zmina.favorite-shift-ids";
const UPDATE_EVENT = "zmina:favorites-updated";

const readFavorites = () => {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
};

export function useFavoriteShifts() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(readFavorites);

  useEffect(() => {
    const syncFavorites = () => setFavoriteIds(readFavorites());
    window.addEventListener("storage", syncFavorites);
    window.addEventListener(UPDATE_EVENT, syncFavorites);

    return () => {
      window.removeEventListener("storage", syncFavorites);
      window.removeEventListener(UPDATE_EVENT, syncFavorites);
    };
  }, []);

  const toggleFavorite = useCallback((shiftId: string | number) => {
    const id = String(shiftId);
    const nextFavoriteIds = readFavorites().includes(id)
      ? readFavorites().filter((favoriteId) => favoriteId !== id)
      : [...readFavorites(), id];

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextFavoriteIds));
      window.dispatchEvent(new Event(UPDATE_EVENT));
    } catch {
      // Якщо localStorage недоступний, картка просто не збереже вибір між сесіями.
    }
  }, []);

  return {
    favoriteIds,
    isFavorite: (shiftId: string | number) => favoriteIds.includes(String(shiftId)),
    toggleFavorite,
  };
}

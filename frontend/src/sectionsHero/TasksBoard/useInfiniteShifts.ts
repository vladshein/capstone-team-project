import { useEffect, useState } from "react";

import { getAllShifts, type Shift } from "../../api/shifts";

// Для дошки потрібен повний набір змін: фільтри дати, партнера й тривалості
// застосовуються на клієнті до побудови локальної пагінації.
const FETCH_LIMIT = 1_000;

export function useInfiniteShifts(categoryIds: string[], isEnabled: boolean) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const categoryKey = categoryIds.join(",");

  useEffect(() => {
    let cancelled = false;

    if (!isEnabled) {
      setShifts([]);
      setError(null);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    setError(null);

    void getAllShifts({
      page: 1,
      limit: FETCH_LIMIT,
      categoryIds: categoryKey,
    })
      .then((response) => {
        if (!cancelled) setShifts(response.data);
      })
      .catch(() => {
        if (!cancelled) setError("Не вдалося завантажити завдання. Спробуйте пізніше.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categoryKey, isEnabled]);

  return { shifts, isLoading, error };
}

import { useEffect, useMemo, useState } from "react";

import { getAllShifts, type GetShiftsParams, type Shift } from "../../api/shifts";

export function useInfiniteShifts(params: GetShiftsParams, isEnabled: boolean) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [partnerOptions, setPartnerOptions] = useState<{ label: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Обидва мультиселекти нормалізуємо, щоб порядок кліків не змінював запит.
  const requestParams = useMemo(
    () => ({
      ...params,
      categoryIds: params.categoryIds?.split(",").filter(Boolean).sort().join(","),
      partners: params.partners?.split(",").filter(Boolean).sort().join(","),
    }),
    [params],
  );
  const requestKey = JSON.stringify(requestParams);

  useEffect(() => {
    let cancelled = false;

    if (!isEnabled) {
      setShifts([]);
      setTotalPages(0);
      setTotalItems(0);
      setPartnerOptions([]);
      setError(null);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    setError(null);

    void getAllShifts(requestParams)
      .then((response) => {
        if (cancelled) return;
        setShifts(response.data);
        setTotalPages(response.totalPages);
        setTotalItems(response.totalItems);
        setPartnerOptions(response.partnerOptions ?? []);
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
  }, [isEnabled, requestKey]);

  return { shifts, totalPages, totalItems, partnerOptions, isLoading, error };
}

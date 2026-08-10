import { useEffect, useMemo, useState } from "react";

import { getAllShifts, type GetShiftsParams, type Shift } from "../../api/shifts";

export function useInfiniteShifts(
  params: GetShiftsParams,
  isEnabled: boolean,
  hasEmptyPartnerSelection = false,
  fallbackWithoutCity = false,
) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [partnerOptions, setPartnerOptions] = useState<{ label: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);

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

    if (!isEnabled || hasEmptyPartnerSelection) {
      setShifts([]);
      setTotalPages(0);
      setTotalItems(0);
      if (!isEnabled) setPartnerOptions([]);
      setError(null);
      setIsFallback(false);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    setError(null);
    setIsFallback(false);

    void getAllShifts(requestParams)
      .then((response) => {
        if (cancelled) return;

        if (fallbackWithoutCity && requestParams.city && response.totalItems === 0) {
          return getAllShifts({ ...requestParams, city: undefined }).then((fallbackResponse) => {
            if (cancelled) return;
            setShifts(fallbackResponse.data);
            setTotalPages(fallbackResponse.totalPages);
            setTotalItems(fallbackResponse.totalItems);
            setPartnerOptions(fallbackResponse.partnerOptions ?? []);
            setIsFallback(fallbackResponse.totalItems > 0);
          });
        }

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
  }, [fallbackWithoutCity, hasEmptyPartnerSelection, isEnabled, requestKey]);

  return { shifts, totalPages, totalItems, partnerOptions, isLoading, error, isFallback };
}

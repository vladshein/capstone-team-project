import { useEffect, useMemo, useReducer } from "react";

import { getAllShifts, type GetShiftsParams, type Shift } from "../../api/shifts";

type PartnerOption = { label: string; count: number };

type ShiftsQueryState = {
  shifts: Shift[];
  totalPages: number;
  totalItems: number;
  partnerOptions: PartnerOption[];
  isLoading: boolean;
  error: string | null;
  isFallback: boolean;
};

const initialState: ShiftsQueryState = {
  shifts: [],
  totalPages: 0,
  totalItems: 0,
  partnerOptions: [],
  isLoading: false,
  error: null,
  isFallback: false,
};

type ShiftsQueryAction =
  | { type: "fetch" }
  | {
      type: "success";
      payload: {
        shifts: Shift[];
        totalPages: number;
        totalItems: number;
        partnerOptions: PartnerOption[];
        isFallback: boolean;
      };
    }
  | { type: "error"; payload: string }
  | { type: "reset"; clearPartnerOptions: boolean };

function shiftsQueryReducer(
  state: ShiftsQueryState,
  action: ShiftsQueryAction,
): ShiftsQueryState {
  switch (action.type) {
    case "fetch":
      return { ...state, isLoading: true, error: null, isFallback: false };
    case "success":
      return { ...state, ...action.payload, isLoading: false, error: null };
    case "error":
      return { ...state, isLoading: false, error: action.payload };
    case "reset":
      return {
        ...initialState,
        partnerOptions: action.clearPartnerOptions ? [] : state.partnerOptions,
      };
    default:
      return state;
  }
}

export function useInfiniteShifts(
  params: GetShiftsParams,
  isEnabled: boolean,
  hasEmptyPartnerSelection = false,
  fallbackWithoutCity = false,
) {
  const [state, dispatch] = useReducer(shiftsQueryReducer, initialState);

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
      dispatch({ type: "reset", clearPartnerOptions: !isEnabled });
      return undefined;
    }

    dispatch({ type: "fetch" });

    void getAllShifts(requestParams)
      .then((response) => {
        if (cancelled) return;

        if (fallbackWithoutCity && requestParams.city && response.totalItems === 0) {
          return getAllShifts({ ...requestParams, city: undefined }).then((fallbackResponse) => {
            if (cancelled) return;
            dispatch({
              type: "success",
              payload: {
                shifts: fallbackResponse.data,
                totalPages: fallbackResponse.totalPages,
                totalItems: fallbackResponse.totalItems,
                partnerOptions: fallbackResponse.partnerOptions ?? [],
                isFallback: fallbackResponse.totalItems > 0,
              },
            });
          });
        }

        dispatch({
          type: "success",
          payload: {
            shifts: response.data,
            totalPages: response.totalPages,
            totalItems: response.totalItems,
            partnerOptions: response.partnerOptions ?? [],
            isFallback: false,
          },
        });
      })
      .catch(() => {
        if (!cancelled) {
          dispatch({
            type: "error",
            payload: "Не вдалося завантажити завдання. Спробуйте пізніше.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fallbackWithoutCity, hasEmptyPartnerSelection, isEnabled, requestKey]);

  return state;
}

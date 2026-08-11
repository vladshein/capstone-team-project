import { useEffect, useMemo, useReducer } from "react";
import {
  getShiftMapMarkers,
  type GetShiftsParams,
  type ShiftMapMarker,
} from "../../api/shifts";

type State = {
  markers: ShiftMapMarker[];
  partnerOptions: { label: string; count: number }[];
  isLoading: boolean;
  error: string | null;
  isFallback: boolean;
};

const initialState: State = {
  markers: [],
  partnerOptions: [],
  isLoading: false,
  error: null,
  isFallback: false,
};

type Action =
  | { type: "fetch" }
  | {
      type: "success";
      markers: ShiftMapMarker[];
      partnerOptions: { label: string; count: number }[];
      isFallback: boolean;
    }
  | { type: "error" }
  | { type: "reset" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "fetch":
      return { ...state, isLoading: true, error: null, isFallback: false };
    case "success":
      return {
        markers: action.markers,
        partnerOptions: action.partnerOptions,
        isLoading: false,
        error: null,
        isFallback: action.isFallback,
      };
    case "error":
      return { ...state, isLoading: false, error: "Не вдалося завантажити точки на карті." };
    case "reset":
      return initialState;
    default:
      return state;
  }
}

const getPartnerOptions = (markers: ShiftMapMarker[]) => {
  const counts = new Map<string, number>();
  markers.forEach((marker) => {
    const name = marker.Location?.Company?.name;
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  });

  return [...counts]
    .map(([label, count]) => ({ label, count }))
    .sort(
      (first, second) =>
        second.count - first.count || first.label.localeCompare(second.label, "uk"),
    );
};

export function useShiftMapMarkers(
  params: Omit<GetShiftsParams, "page" | "limit">,
  isEnabled: boolean,
  hasEmptyPartnerSelection = false,
  fallbackWithoutCity = false,
) {
  const [state, dispatch] = useReducer(reducer, initialState);
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
      dispatch({ type: "reset" });
      return undefined;
    }

    dispatch({ type: "fetch" });

    void getShiftMapMarkers(requestParams)
      .then(async (markers) => {
        if (cancelled) return;

        if (fallbackWithoutCity && requestParams.city && markers.length === 0) {
          const fallbackMarkers = await getShiftMapMarkers({
            ...requestParams,
            city: undefined,
          });
          if (cancelled) return;
          dispatch({
            type: "success",
            markers: fallbackMarkers,
            partnerOptions: getPartnerOptions(fallbackMarkers),
            isFallback: fallbackMarkers.length > 0,
          });
          return;
        }

        dispatch({
          type: "success",
          markers,
          partnerOptions: getPartnerOptions(markers),
          isFallback: false,
        });
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [fallbackWithoutCity, hasEmptyPartnerSelection, isEnabled, requestKey]);

  return state;
}

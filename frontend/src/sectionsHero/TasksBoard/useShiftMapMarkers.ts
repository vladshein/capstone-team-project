import { useEffect, useMemo, useReducer } from "react";
import {
  getShiftMapMarkers,
  type GetShiftsParams,
  type ShiftMapMarker,
} from "../../api/shifts";

type State = {
  markers: ShiftMapMarker[];
  partnerOptions: { label: string; count: number }[];
  isTruncated: boolean;
  isLoading: boolean;
  error: string | null;
  isFallback: boolean;
};

const initialState: State = {
  markers: [],
  partnerOptions: [],
  isTruncated: false,
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
      isTruncated: boolean;
      isFallback: boolean;
    }
  | { type: "error" }
  | { type: "reset"; clearPartnerOptions: boolean };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "fetch":
      return { ...state, isLoading: true, error: null, isFallback: false };
    case "success":
      return {
        markers: action.markers,
        partnerOptions: action.partnerOptions,
        isTruncated: action.isTruncated,
        isLoading: false,
        error: null,
        isFallback: action.isFallback,
      };
    case "error":
      return { ...state, isLoading: false, error: "Не вдалося завантажити точки на карті." };
    case "reset":
      return {
        ...initialState,
        partnerOptions: action.clearPartnerOptions ? [] : state.partnerOptions,
      };
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
      dispatch({ type: "reset", clearPartnerOptions: !isEnabled });
      return undefined;
    }

    dispatch({ type: "fetch" });

    void getShiftMapMarkers(requestParams)
      .then(async (response) => {
        if (cancelled) return;

        if (fallbackWithoutCity && requestParams.city && response.data.length === 0 && requestParams.radiusKm) {
          const fallbackResponse = await getShiftMapMarkers({
            ...requestParams,
            city: undefined,
          });
          if (cancelled) return;
          dispatch({
            type: "success",
            markers: fallbackResponse.data,
            partnerOptions: fallbackResponse.partnerOptions ?? getPartnerOptions(fallbackResponse.data),
            isTruncated: fallbackResponse.isTruncated,
            isFallback: fallbackResponse.data.length > 0,
          });
          return;
        }

        dispatch({
          type: "success",
          markers: response.data,
          partnerOptions: response.partnerOptions ?? getPartnerOptions(response.data),
          isTruncated: response.isTruncated,
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

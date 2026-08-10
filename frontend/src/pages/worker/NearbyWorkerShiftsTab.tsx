import { useEffect, useState } from "react";

import { getAllShifts, type Shift } from "../../api/shifts";
import { TaskCard } from "../../sectionsHero/TasksBoard/TaskCard";
import { useApproximateLocation } from "../../sectionsHero/TasksBoard/useApproximateLocation";

const SHIFTS_LIMIT = 4;

export function NearbyWorkerShiftsTab() {
  const { location, isLoading: isLoadingLocation } = useApproximateLocation();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    setIsLoading(true);
    setError(null);
    setIsFallback(false);
    const baseParams = {
      page: 1,
      limit: SHIFTS_LIMIT,
      dateFrom: new Date().toISOString(),
      sort: "nearest",
      latitude: location?.latitude ?? undefined,
      longitude: location?.longitude ?? undefined,
    } as const;

    void getAllShifts({ ...baseParams, city: location?.city ?? undefined })
      .then((response) => {
        if (!isCurrent) return;
        if (response.data.length > 0 || !location?.city) {
          setShifts(response.data);
          return;
        }

        setIsFallback(true);
        return getAllShifts(baseParams).then((fallbackResponse) => {
          if (isCurrent) setShifts(fallbackResponse.data);
        });
      })
      .catch(() => {
        if (isCurrent) setError("Не вдалося завантажити доступні зміни.");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [location?.city, location?.latitude, location?.longitude]);

  return (
    <div className="p-4 sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold text-ink">Доступні зміни поруч</h3>
          <p className="mt-1 text-sm text-text-muted">
            {isLoadingLocation
              ? "Визначаємо місто…"
              : location?.city
                ? isFallback
                  ? `У ${location.city} поки немає змін — показуємо найближчі доступні`
                  : `Добірка для міста ${location.city}`
                : "Найближчі доступні зміни"}
          </p>
        </div>
        <a href="/#zavdannia" className="text-sm font-medium text-accent hover:text-accent-text">
          Усі зміни →
        </a>
      </div>

      {isLoading && <p className="py-8 text-center text-sm text-text-subtle">Завантажуємо зміни…</p>}
      {!isLoading && error && <p className="py-8 text-center text-sm text-danger">{error}</p>}
      {!isLoading && !error && shifts.length === 0 && (
        <p className="py-8 text-center text-sm text-text-subtle">Поки немає доступних змін поруч.</p>
      )}
      {!isLoading && !error && shifts.length > 0 && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {shifts.map((shift) => <TaskCard key={shift.id} shift={shift} />)}
        </div>
      )}
    </div>
  );
}

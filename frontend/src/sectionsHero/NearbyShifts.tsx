import { LayoutGrid, LocateFixed } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getAllShifts, type Shift } from "../api/shifts";
import { ShiftCard } from "../components/cards/ShiftCard";
import { Loader } from "../components/ui/Loader";
import { useApproximateLocation } from "./TasksBoard/useApproximateLocation";
import { useGeolocation } from "./TasksBoard/useGeolocation";
import { CATEGORY_ICONS } from "./TasksBoard/CategoryPicker";
import { formatShiftDate, formatTimeRange } from "./TasksBoard/formatters";

const getDistanceInKilometres = (
  latitude: number,
  longitude: number,
  targetLatitude?: number,
  targetLongitude?: number,
) => {
  if (targetLatitude === undefined || targetLongitude === undefined) return null;

  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(targetLatitude - latitude);
  const longitudeDelta = toRadians(targetLongitude - longitude);
  const calculation =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(latitude)) *
      Math.cos(toRadians(targetLatitude)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(calculation), Math.sqrt(1 - calculation));
};

const getShiftTotal = (shift: Shift) => {
  const duration = Math.max(
    (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / 3_600_000,
    0,
  );
  return duration * (Number(shift.hourlyRate) || 0) + (Number(shift.bonusRate) || 0);
};

export function NearbyShifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { coordinates, error: locationError, isLocating, requestLocation } = useGeolocation();
  const { location: approximateLocation } = useApproximateLocation();

  useEffect(() => {
    let isCurrent = true;

    void getAllShifts({ page: 1, limit: 100 })
      .then((response) => {
        if (isCurrent) setShifts(response.data);
      })
      .catch(() => {
        // Помилка завантаження не має ламати головну сторінку.
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const origin = useMemo(() => {
    if (coordinates) return coordinates;
    if (
      typeof approximateLocation?.latitude === "number" &&
      typeof approximateLocation.longitude === "number"
    ) {
      return {
        latitude: approximateLocation.latitude,
        longitude: approximateLocation.longitude,
      };
    }
    return null;
  }, [approximateLocation, coordinates]);

  const nearbyShifts = useMemo(() => {
    const now = new Date();

    return shifts
      .filter((shift) => new Date(shift.startTime) >= now)
      .map((shift) => ({
        shift,
        CategoryIcon:
          CATEGORY_ICONS[shift.Category?.name ?? shift.category?.name ?? ""] ?? LayoutGrid,
        distance: origin
          ? getDistanceInKilometres(
              origin.latitude,
              origin.longitude,
              shift.Location?.latitude,
              shift.Location?.longitude,
            )
          : null,
      }))
      .sort((first, second) => {
        if (first.distance !== null && second.distance !== null) return first.distance - second.distance;
        if (first.distance !== null) return -1;
        if (second.distance !== null) return 1;
        return new Date(first.shift.startTime).getTime() - new Date(second.shift.startTime).getTime();
      })
      .slice(0, 4);
  }, [origin, shifts]);

  return (
    <section className="bg-bg-muted py-[calc(var(--space-section)-1.5rem)] sm:py-[calc(var(--space-section)-1rem)] md:py-[var(--space-section)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              Доступно поруч із тобою
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              {coordinates
                ? "Зміни відсортовані за вашою точною локацією"
                : approximateLocation?.city
                  ? `Орієнтовно для міста ${approximateLocation.city}`
                  : "Визначте локацію, щоб побачити найближчі зміни"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={requestLocation}
              disabled={isLocating}
              className="inline-flex min-h-[40px] items-center gap-2 text-sm font-medium text-accent transition-colors hover:text-accent-text disabled:cursor-wait disabled:opacity-60"
            >
              <LocateFixed className="h-4 w-4" />
              {isLocating ? "Визначаємо…" : coordinates ? "Оновити локацію" : "Визначити локацію"}
            </button>
            <a href="#zavdannia" className="text-sm font-medium text-accent hover:text-accent-text">
              Усі зміни →
            </a>
          </div>
        </div>

        {locationError && <p className="mt-3 text-xs text-danger">{locationError}</p>}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {isLoading && (
            <div className="sm:col-span-2 lg:col-span-4">
              <Loader label="Завантажуємо зміни…" />
            </div>
          )}
          {!isLoading && nearbyShifts.map(({ shift, distance, CategoryIcon }) => (
            <ShiftCard
              key={shift.id}
              shift={{
                id: shift.id,
                category: <CategoryIcon className="h-5 w-5 text-accent" />,
                role: shift.description || shift.JobPosition?.title || shift.Category?.name || "Зміна",
                company: shift.Location?.Company?.name || "Партнер не вказаний",
                date: `${formatShiftDate(shift.startTime)} · ${formatTimeRange(shift.startTime, shift.endTime)}`,
                rate: Math.round(Number(shift.hourlyRate) || 0),
                budget: Math.round(getShiftTotal(shift)),
                distance: distance === null ? "Відстань уточнюється" : `${distance.toFixed(1)} км`,
              }}
            />
          ))}
          {!isLoading && nearbyShifts.length === 0 && (
            <p className="text-sm text-text-muted sm:col-span-2 lg:col-span-4">Поки немає відкритих змін поруч.</p>
          )}
        </div>
      </div>
    </section>
  );
}

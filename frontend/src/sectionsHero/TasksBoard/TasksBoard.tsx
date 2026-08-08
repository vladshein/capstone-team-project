import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CategoryPicker } from "./CategoryPicker";
import type { CalendarPeriod } from "./DateStrip";
import { FilterSidebar } from "./FilterSidebar";
import { TaskCard } from "./TaskCard";
import { useGeolocation } from "./useGeolocation";
import { useApproximateLocation } from "./useApproximateLocation";
import { useInfiniteShifts } from "./useInfiniteShifts";
import { useCategories } from "./useCategories";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  selectSelectedDurationFilters,
  selectSelectedPartners,
  selectShiftSort,
} from "../../redux/shift/selectors";
import { clearSelectedPartners } from "../../redux/shift/slice";

const getShiftTotal = (shift: { startTime: string; endTime: string; hourlyRate: number | string; bonusRate: number | string }) => {
  const hours = Math.max((new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / 3_600_000, 0);
  return hours * (Number(shift.hourlyRate) || 0) + (Number(shift.bonusRate) || 0);
};

const getDistance = (latitude: number, longitude: number, targetLatitude?: number, targetLongitude?: number) => {
  if (targetLatitude === undefined || targetLongitude === undefined) return Number.POSITIVE_INFINITY;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(targetLatitude - latitude);
  const longitudeDelta = toRadians(targetLongitude - longitude);
  const value = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(toRadians(latitude)) * Math.cos(toRadians(targetLatitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

export function TasksBoard() {
  const dispatch = useAppDispatch();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | number | null
  >(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarPeriod, setCalendarPeriod] = useState<CalendarPeriod>("week");
  const { shifts, isLoading, error, page, totalPages, goToPage } =
    useInfiniteShifts(scrollContainerRef, selectedCategoryId, Boolean(selectedCategoryId));
  const { coordinates, error: locationError, isLocating, requestLocation } =
    useGeolocation();
  const { location: approximateLocation, isLoading: isLoadingApproximateLocation } =
    useApproximateLocation();
  const { categories, error: categoriesError, isLoading: isLoadingCategories } =
    useCategories();
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const sort = useAppSelector(selectShiftSort);
  const selectedPartners = useAppSelector(selectSelectedPartners);
  const selectedDurationFilters = useAppSelector(selectSelectedDurationFilters);

  useEffect(() => {
    dispatch(clearSelectedPartners());
  }, [dispatch, selectedCategoryId]);
  const partnerOptions = useMemo(() => {
    const counts = new Map<string, number>();
    shifts.forEach((shift) => {
      const name = shift.Location?.Company?.name;
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    });
    return [...counts].map(([label, count]) => ({ label, count })).sort((first, second) => second.count - first.count || first.label.localeCompare(second.label, "uk"));
  }, [shifts]);
  const visibleShifts = useMemo(() => {
    const today = new Date();
    const periodStart = selectedDate
      ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
      : new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const periodEnd = new Date(periodStart);
    if (calendarPeriod === "day") {
      periodEnd.setDate(periodStart.getDate() + 1);
    } else if (calendarPeriod === "week") {
      periodEnd.setDate(periodStart.getDate() + 7);
    } else {
      periodEnd.setDate(periodStart.getDate() + 30);
    }
    const sorted = shifts.filter((shift) => {
      const shiftDate = new Date(shift.startTime);
      const matchesDate = shiftDate >= periodStart && shiftDate < periodEnd;
      const matchesPartner = selectedPartners.length === 0 || selectedPartners.includes(shift.Location?.Company?.name ?? "");
      const durationInHours = Math.max((new Date(shift.endTime).getTime() - shiftDate.getTime()) / 3_600_000, 0);
      const matchesDuration = selectedDurationFilters.length === 0 || selectedDurationFilters.some((filter) => {
        if (filter === "До 4 год") return durationInHours <= 4;
        if (filter === "4–8 год") return durationInHours > 4 && durationInHours <= 8;
        return durationInHours > 8;
      });
      return matchesDate && matchesPartner && matchesDuration;
    });
    if (sort === "price_desc") return sorted.sort((first, second) => getShiftTotal(second) - getShiftTotal(first));
    if (sort === "date_asc") return sorted.sort((first, second) => new Date(first.startTime).getTime() - new Date(second.startTime).getTime());
    if (sort === "date_desc") return sorted.sort((first, second) => new Date(second.startTime).getTime() - new Date(first.startTime).getTime());
    if (sort === "nearest" && coordinates) {
      return sorted.sort((first, second) => getDistance(coordinates.latitude, coordinates.longitude, first.Location?.latitude, first.Location?.longitude) - getDistance(coordinates.latitude, coordinates.longitude, second.Location?.latitude, second.Location?.longitude));
    }
    return sorted;
  }, [calendarPeriod, coordinates, selectedDate, selectedDurationFilters, selectedPartners, shifts, sort]);

  return (
    <section id="zavdannia" className="mx-auto max-w-7xl px-4 py-[calc(var(--space-section)-1.5rem)] sm:px-6 sm:py-[calc(var(--space-section)-1rem)] md:px-8 md:py-[var(--space-section)]">
      <h2 className="font-heading text-3xl font-bold uppercase leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">
        Більше 10 000 завдань щодня
      </h2>

      <div className="mt-8 grid gap-6 sm:mt-10 lg:grid-cols-[280px_1fr] lg:gap-8">
        <FilterSidebar
          coordinates={coordinates}
          isLocating={isLocating}
          locationError={locationError}
          onRequestLocation={requestLocation}
          approximateLocation={approximateLocation}
          isLoadingApproximateLocation={isLoadingApproximateLocation}
          hasSelectedCategory={Boolean(selectedCategoryId)}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          calendarPeriod={calendarPeriod}
          onCalendarPeriodChange={setCalendarPeriod}
          partnerOptions={partnerOptions}
        />

        <div
          ref={scrollContainerRef}
          className="min-w-0"
        >
          {!selectedCategoryId && isLoadingCategories && (
            <p className="text-sm text-text-muted">Завантажуємо категорії…</p>
          )}
          {!selectedCategoryId && categoriesError && (
            <p className="text-sm text-danger">{categoriesError}</p>
          )}
          {!selectedCategoryId && !isLoadingCategories && !categoriesError && (
            <CategoryPicker categories={categories} onSelect={setSelectedCategoryId} />
          )}

          {selectedCategoryId && (
            <>
              <button
                type="button"
                onClick={() => setSelectedCategoryId(null)}
                className="mb-5 inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-text-muted transition-colors hover:text-accent-text"
              >
                <ArrowLeft className="h-4 w-4" /> Усі категорії
              </button>
              <h3 className="mb-5 font-heading text-2xl font-bold text-ink">
                {selectedCategory?.name ?? "Зміни"}
              </h3>
            </>
          )}

          {selectedCategoryId && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
              {isLoading && (
                <p className="text-sm text-text-muted sm:col-span-2">Завантаження завдань…</p>
              )}
              {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
              {!isLoading && !error && visibleShifts.length === 0 && (
                <p className="text-sm text-text-muted sm:col-span-2">Наразі немає доступних завдань.</p>
              )}

              {!isLoading && visibleShifts.map((shift) => <TaskCard key={shift.id} shift={shift} />)}

            </div>
          )}
          {selectedCategoryId && totalPages > 0 && (
            <nav className="mt-6 flex items-center justify-center gap-1.5" aria-label="Пагінація змін">
              <button type="button" onClick={() => goToPage(page - 1)} disabled={page === 1} className="min-h-[40px] rounded-[var(--radius-pill)] border border-border px-3 text-sm text-text-muted disabled:cursor-not-allowed disabled:opacity-40">Назад</button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button key={pageNumber} type="button" onClick={() => goToPage(pageNumber)} aria-current={pageNumber === page ? "page" : undefined} className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-pill)] text-sm font-medium transition-colors ${pageNumber === page ? "bg-accent text-white" : "border border-border text-text hover:border-accent"}`}>{pageNumber}</button>
              ))}
              <button type="button" onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="min-h-[40px] rounded-[var(--radius-pill)] border border-border px-3 text-sm text-text-muted disabled:cursor-not-allowed disabled:opacity-40">Далі</button>
            </nav>
          )}
        </div>
      </div>
    </section>
  );
}

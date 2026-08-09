import { useEffect, useMemo, useRef, useState } from "react";
import { CategoryPicker } from "./CategoryPicker";
import type { CalendarPeriod } from "./DateStrip";
import { FilterSidebar } from "./FilterSidebar";
import { TaskCard } from "./TaskCard";
import { useApproximateLocation } from "./useApproximateLocation";
import { useInfiniteShifts } from "./useInfiniteShifts";
import { useCategories } from "./useCategories";
import { useGeolocation } from "./useGeolocation";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  selectSelectedCategories,
  selectSelectedDurationFilters,
  selectSelectedPartners,
  selectShiftSort,
} from "../../redux/shift/selectors";
import { toggleCategory } from "../../redux/shift/slice";

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

const normalizeCity = (city: string) => city.trim().toLocaleLowerCase("uk-UA");
const CARDS_PER_PAGE = 8;

const getPaginationPages = (totalPages: number, currentPage: number) => {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  return [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((first, second) => first - second);
};

export function TasksBoard() {
  const dispatch = useAppDispatch();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarPeriod, setCalendarPeriod] = useState<CalendarPeriod>("week");
  const [manualCity, setManualCity] = useState(() => {
    try {
      return window.localStorage.getItem("zmina.manual-city") ?? "";
    } catch {
      return "";
    }
  });
  const { coordinates, error: locationError, isLocating, requestLocation } = useGeolocation();
  const { location: approximateLocation, isLoading: isLoadingApproximateLocation } =
    useApproximateLocation();
  const { categories, error: categoriesError, isLoading: isLoadingCategories } =
    useCategories();
  const sort = useAppSelector(selectShiftSort);
  const selectedCategories = useAppSelector(selectSelectedCategories);
  const { shifts, isLoading, error } =
    useInfiniteShifts(selectedCategories, selectedCategories.length > 0);
  const selectedPartners = useAppSelector(selectSelectedPartners);
  const selectedDurationFilters = useAppSelector(selectSelectedDurationFilters);
  const approximateCoordinates =
    typeof approximateLocation?.latitude === "number" &&
    typeof approximateLocation.longitude === "number"
      ? {
          latitude: approximateLocation.latitude,
          longitude: approximateLocation.longitude,
        }
      : null;
  const toggleCategoryFromCard = (categoryId: string) => {
    dispatch(toggleCategory(categoryId));
  };
  const saveManualCity = (city: string) => {
    const normalizedCity = city.trim();
    setManualCity(normalizedCity);
    try {
      window.localStorage.setItem("zmina.manual-city", normalizedCity);
    } catch {
      // Збереження в браузері — лише зручність, форма має працювати й без нього.
    }
  };

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
      const matchesManualCity = !manualCity || normalizeCity(shift.Location?.city ?? "") === normalizeCity(manualCity);
      const durationInHours = Math.max((new Date(shift.endTime).getTime() - shiftDate.getTime()) / 3_600_000, 0);
      const matchesDuration = selectedDurationFilters.length === 0 || selectedDurationFilters.some((filter) => {
        if (filter === "До 4 год") return durationInHours <= 4;
        if (filter === "4–8 год") return durationInHours > 4 && durationInHours <= 8;
        return durationInHours > 8;
      });
      return matchesDate && matchesPartner && matchesManualCity && matchesDuration;
    });
    if (sort === "price_desc") return sorted.sort((first, second) => getShiftTotal(second) - getShiftTotal(first));
    if (sort === "date_asc") return sorted.sort((first, second) => new Date(first.startTime).getTime() - new Date(second.startTime).getTime());
    if (sort === "date_desc") return sorted.sort((first, second) => new Date(second.startTime).getTime() - new Date(first.startTime).getTime());
    const locationOrigin = coordinates ?? approximateCoordinates;
    if (sort === "nearest" && locationOrigin) {
      return sorted.sort((first, second) => getDistance(locationOrigin.latitude, locationOrigin.longitude, first.Location?.latitude, first.Location?.longitude) - getDistance(locationOrigin.latitude, locationOrigin.longitude, second.Location?.latitude, second.Location?.longitude));
    }
    return sorted;
  }, [approximateCoordinates, calendarPeriod, coordinates, manualCity, selectedDate, selectedDurationFilters, selectedPartners, shifts, sort]);
  const totalPages = Math.ceil(visibleShifts.length / CARDS_PER_PAGE);
  const activePage = Math.min(currentPage, Math.max(totalPages, 1));
  const pageShifts = visibleShifts.slice(
    (activePage - 1) * CARDS_PER_PAGE,
    activePage * CARDS_PER_PAGE,
  );
  const paginationPages = getPaginationPages(totalPages, activePage);

  useEffect(() => {
    setCurrentPage(1);
  }, [calendarPeriod, manualCity, selectedCategories, selectedDate, selectedDurationFilters, selectedPartners, sort]);

  const changePage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === activePage) return;
    setCurrentPage(nextPage);
    const listTop = scrollContainerRef.current?.getBoundingClientRect().top;
    const headerHeight = document.querySelector("header")?.getBoundingClientRect().height ?? 0;

    if (listTop !== undefined) {
      window.scrollTo({
        top: Math.max(window.scrollY + listTop - headerHeight - 16, 0),
        behavior: "smooth",
      });
    }
  };

  return (
    <section id="zavdannia" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-[calc(var(--space-section)-1.5rem)] sm:px-6 sm:py-[calc(var(--space-section)-1rem)] md:px-8 md:py-[var(--space-section)]">
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
          manualCity={manualCity}
          onSaveManualCity={saveManualCity}
          isLoadingApproximateLocation={isLoadingApproximateLocation}
          hasSelectedCategory={selectedCategories.length > 0}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          calendarPeriod={calendarPeriod}
          onCalendarPeriodChange={setCalendarPeriod}
          partnerOptions={partnerOptions}
          categories={categories}
        />

        <div
          ref={scrollContainerRef}
          className="min-w-0"
        >
          {isLoadingCategories && (
            <p className="text-sm text-text-muted">Завантажуємо категорії…</p>
          )}
          {categoriesError && (
            <p className="text-sm text-danger">{categoriesError}</p>
          )}
          {!isLoadingCategories && !categoriesError && (
            <>
              {selectedCategories.length === 0 ? (
                <CategoryPicker
                  categories={categories}
                  selectedCategoryIds={selectedCategories}
                  onToggle={toggleCategoryFromCard}
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                {isLoading && (
                  <p className="text-sm text-text-muted sm:col-span-2">Завантаження завдань…</p>
                )}
                {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
                {!isLoading && !error && visibleShifts.length === 0 && (
                  <p className="text-sm text-text-muted sm:col-span-2">Наразі немає доступних завдань.</p>
                )}

                {!isLoading && pageShifts.map((shift) => <TaskCard key={shift.id} shift={shift} />)}
                </div>
              )}
            </>
          )}
          {!isLoadingCategories && !categoriesError && selectedCategories.length > 0 && totalPages > 1 && (
            <nav className="mt-6 flex items-center justify-center gap-1.5" aria-label="Пагінація змін">
              <button type="button" onClick={() => changePage(activePage - 1)} disabled={activePage === 1} className="min-h-[40px] rounded-[var(--radius-pill)] border border-border px-3 text-sm text-text-muted disabled:cursor-not-allowed disabled:opacity-40">Назад</button>
              {paginationPages.map((pageNumber, index) => (
                <span key={pageNumber} className="contents">
                  {index > 0 && pageNumber - paginationPages[index - 1] > 1 && <span className="px-1 text-text-subtle">…</span>}
                  <button type="button" onClick={() => changePage(pageNumber)} aria-current={pageNumber === activePage ? "page" : undefined} className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-pill)] text-sm font-medium transition-colors ${pageNumber === activePage ? "bg-accent text-white" : "border border-border text-text hover:border-accent"}`}>{pageNumber}</button>
                </span>
              ))}
              <button type="button" onClick={() => changePage(activePage + 1)} disabled={activePage === totalPages} className="min-h-[40px] rounded-[var(--radius-pill)] border border-border px-3 text-sm text-text-muted disabled:cursor-not-allowed disabled:opacity-40">Далі</button>
            </nav>
          )}
        </div>
      </div>
    </section>
  );
}

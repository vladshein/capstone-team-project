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
  selectPartnerSelectionMode,
  selectShiftSort,
} from "../../redux/shift/selectors";
import { toggleCategory } from "../../redux/shift/slice";

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
  const selectedPartners = useAppSelector(selectSelectedPartners);
  const partnerSelectionMode = useAppSelector(selectPartnerSelectionMode);
  const selectedDurationFilters = useAppSelector(selectSelectedDurationFilters);
  const approximateCoordinates =
    typeof approximateLocation?.latitude === "number" &&
    typeof approximateLocation.longitude === "number"
      ? {
          latitude: approximateLocation.latitude,
          longitude: approximateLocation.longitude,
        }
      : null;
  const selectedCity = manualCity || approximateLocation?.city || undefined;
  const shiftRequestParams = useMemo(() => {
    const now = new Date();
    const periodStart = selectedDate
      ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
      : new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodStart.getDate() + (calendarPeriod === "day" ? 1 : calendarPeriod === "week" ? 7 : 30));
    const locationOrigin = coordinates ?? approximateCoordinates;

    return {
      page: currentPage,
      limit: CARDS_PER_PAGE,
      categoryIds: [...selectedCategories].sort().join(","),
      partners: partnerSelectionMode === "selected" ? [...selectedPartners].sort().join(",") : undefined,
      durationFilters: [...selectedDurationFilters].sort().join(",") || undefined,
      city: selectedCity,
      dateFrom: periodStart.toISOString(),
      dateTo: periodEnd.toISOString(),
      sort,
      latitude: locationOrigin?.latitude,
      longitude: locationOrigin?.longitude,
    };
  }, [approximateCoordinates, calendarPeriod, coordinates, currentPage, partnerSelectionMode, selectedCategories, selectedCity, selectedDurationFilters, selectedPartners, selectedDate, sort]);
  const { shifts, totalPages, partnerOptions, isLoading, error, isFallback } = useInfiniteShifts(
    shiftRequestParams,
    selectedCategories.length > 0,
    partnerSelectionMode === "none",
    true,
  );
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

  const fallbackPartnerOptions = useMemo(() => {
    const counts = new Map<string, number>();
    shifts.forEach((shift) => {
      const name = shift.Location?.Company?.name;
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    });
    return [...counts].map(([label, count]) => ({ label, count })).sort((first, second) => second.count - first.count || first.label.localeCompare(second.label, "uk"));
  }, [shifts]);
  const activePage = Math.min(currentPage, Math.max(totalPages, 1));
  const paginationPages = getPaginationPages(totalPages, activePage);

  useEffect(() => {
    setCurrentPage(1);
  }, [calendarPeriod, selectedCity, partnerSelectionMode, selectedCategories, selectedDate, selectedDurationFilters, selectedPartners, sort]);

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
          partnerOptions={partnerOptions.length > 0 ? partnerOptions : fallbackPartnerOptions}
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
                <>
                {isFallback && selectedCity && !isLoading && (
                  <p className="mb-4 rounded-[var(--radius-card)] border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-accent-text">
                    У {selectedCity} за обраними фільтрами поки немає змін — показуємо найближчі доступні.
                  </p>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                {isLoading && (
                  <p className="text-sm text-text-muted sm:col-span-2">Завантаження завдань…</p>
                )}
                {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
                {!isLoading && !error && shifts.length === 0 && (
                  <p className="text-sm text-text-muted sm:col-span-2">Наразі немає доступних завдань.</p>
                )}

                {!isLoading && shifts.map((shift) => <TaskCard key={shift.id} shift={shift} />)}
                </div>
                </>
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

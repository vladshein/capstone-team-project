import { LocateFixed, MapPin } from "lucide-react";
import { useState } from "react";
import { DateStrip } from "./DateStrip";
import type { CalendarPeriod } from "./DateStrip";
import { FilterAccordion } from "./FilterAccordion";
import { FILTER_SECTIONS } from "./filterSections";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  clearSelectedCategories,
  setPartnerSelectionMode,
  setShiftSort,
  setSelectedCategories,
  setSelectedPartners,
  toggleCategory,
  toggleDurationFilter,
  togglePartner,
} from "../../redux/shift/slice";
import {
  selectSelectedCategories,
  selectSelectedDurationFilters,
  selectSelectedPartners,
  selectPartnerSelectionMode,
  selectShiftSort,
} from "../../redux/shift/selectors";
import type { ShiftDurationFilter } from "../../redux/shift/types";
import type { ApproximateLocation } from "../../api/location";
import type { Category } from "../../api/categories";
import type { UserCoordinates } from "./useGeolocation";

interface FilterSidebarProps {
  coordinates: UserCoordinates | null;
  isLocating: boolean;
  locationError: string | null;
  onRequestLocation: () => void;
  approximateLocation: ApproximateLocation | null;
  preciseCity: string | null;
  manualCity: string;
  onSaveManualCity: (city: string) => void;
  isLoadingApproximateLocation: boolean;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  calendarPeriod: CalendarPeriod;
  onCalendarPeriodChange: (period: CalendarPeriod) => void;
  partnerOptions: { label: string; count: number }[];
  categories: Category[];
}

export function FilterSidebar({
  coordinates,
  isLocating,
  locationError,
  onRequestLocation,
  approximateLocation,
  preciseCity,
  manualCity,
  onSaveManualCity,
  isLoadingApproximateLocation,
  selectedDate,
  onSelectDate,
  calendarPeriod,
  onCalendarPeriodChange,
  partnerOptions,
  categories,
}: FilterSidebarProps) {
  const [cityInput, setCityInput] = useState("");
  const dispatch = useAppDispatch();
  const sort = useAppSelector(selectShiftSort);
  const selectedPartners = useAppSelector(selectSelectedPartners);
  const partnerSelectionMode = useAppSelector(selectPartnerSelectionMode);
  const selectedCategories = useAppSelector(selectSelectedCategories);
  const selectedDurationFilters = useAppSelector(selectSelectedDurationFilters);
  const sections = FILTER_SECTIONS.filter((section) => section.id !== "service").map((section) => {
    if (section.id === "partner") {
      return {
        ...section,
        count: partnerOptions.length,
        options: [{ id: "all", label: "Усі партнери" }, ...partnerOptions],
      };
    }
    if (section.id === "category") {
      return {
        ...section,
        count: categories.length,
        options: [
          { id: "all", label: "Усі категорії" },
          ...categories.map((category) => ({ id: category.id, label: category.name })),
        ],
      };
    }
    return section;
  });
  const sortLabels = { relevance: "За релевантністю", date_asc: "Спочатку найближчі за датою", date_desc: "Спочатку пізніші за датою", price_desc: "Спочатку дорожчі", nearest: "Найближчі до мене" } as const;
  const sortByLabel = Object.fromEntries(Object.entries(sortLabels).map(([key, label]) => [label, key])) as Record<string, "relevance" | "date_asc" | "date_desc" | "price_desc" | "nearest">;
  const toggleCategoryFilter = (categoryId: string) => {
    if (categoryId === "all") {
      dispatch(
        selectedCategories.length === categories.length
          ? clearSelectedCategories()
          : setSelectedCategories(categories.map((category) => String(category.id))),
      );
      return;
    }
    dispatch(toggleCategory(categoryId));
  };
  const togglePartnerFilter = (partner: string) => {
    if (partner === "all") {
      dispatch(setPartnerSelectionMode(partnerSelectionMode === "all" ? "none" : "all"));
      return;
    }

    if (partnerSelectionMode === "all") {
      dispatch(setSelectedPartners(partnerOptions.map((option) => option.label).filter((label) => label !== partner)));
      return;
    }
    dispatch(togglePartner(partner));
  };

  return (
    <aside className="flex flex-col gap-4">
      <DateStrip
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        period={calendarPeriod}
        onPeriodChange={onCalendarPeriodChange}
      />
      <div className="rounded-[var(--radius-card)] border border-border bg-bg p-4">
        <div className="mb-3 flex items-center gap-2 rounded-[var(--radius-card)] bg-bg-muted px-3 py-2.5 text-sm text-text-muted">
          <MapPin className="h-4 w-4 shrink-0 text-accent" />
          {isLoadingApproximateLocation
            ? "Визначаємо ваше місто…"
            : preciseCity || manualCity || approximateLocation?.city
              ? `Ваше місто: ${preciseCity || manualCity || approximateLocation?.city}`
              : "Місто не вдалося визначити"}
        </div>
        <button
          type="button"
          onClick={onRequestLocation}
          disabled={isLocating}
          className="mb-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[var(--radius-card)] border border-accent/30 bg-accent/10 px-3 text-sm font-medium text-accent-text transition-colors hover:bg-accent/15 disabled:cursor-wait disabled:opacity-60"
        >
          <LocateFixed className="h-4 w-4" />
          {isLocating
            ? "Визначаємо локацію…"
            : coordinates
              ? "Точну локацію визначено"
              : "Визначити точну локацію"}
        </button>
        {locationError && <p className="mb-3 text-xs leading-5 text-danger">{locationError}</p>}
        {!approximateLocation?.city && !coordinates && locationError && !manualCity && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (cityInput.trim()) onSaveManualCity(cityInput);
            }}
            className="mb-3 rounded-[var(--radius-card)] border border-border bg-bg-muted p-3"
          >
            <label htmlFor="manual-city" className="block text-sm font-medium text-ink">
              Ваше місто
            </label>
            <p className="mt-1 text-xs leading-5 text-text-muted">
              Вкажіть місто, щоб уточнити доступні зміни.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                id="manual-city"
                value={cityInput}
                onChange={(event) => setCityInput(event.target.value)}
                placeholder="Наприклад, Вінниця"
                className="min-w-0 flex-1 rounded-[var(--radius-card)] border border-border bg-bg px-3 py-2 text-sm outline-none placeholder:text-text-subtle focus:border-accent"
              />
              <button
                type="submit"
                disabled={!cityInput.trim()}
                className="min-h-[40px] rounded-[var(--radius-card)] bg-accent px-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Готово
              </button>
            </div>
          </form>
        )}
        {sections.map((section) => (
          <div key={section.id}>
            <FilterAccordion
              section={section}
              onRequestPreciseLocation={onRequestLocation}
              selectedOption={section.id === "sort" ? sortLabels[sort] : undefined}
              onSelectOption={section.id === "sort" ? (label) => dispatch(setShiftSort(label ? sortByLabel[label] : "relevance")) : undefined}
              onToggleOption={
                section.id === "partner"
                  ? togglePartnerFilter
                  : section.id === "category"
                    ? toggleCategoryFilter
                    : section.id === "duration"
                      ? (filter) => dispatch(toggleDurationFilter(filter as ShiftDurationFilter))
                      : undefined
              }
              selectedOptions={
                section.id === "partner"
                  ? partnerSelectionMode === "all"
                    ? ["all", ...partnerOptions.map((option) => option.label)]
                    : selectedPartners
                  : section.id === "category"
                    ? selectedCategories.length === categories.length
                        ? ["all", ...selectedCategories]
                      : selectedCategories
                    : section.id === "duration"
                      ? selectedDurationFilters
                      : undefined
              }
            />
          </div>
        ))}
      </div>
    </aside>
  );
}

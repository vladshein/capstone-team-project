import { LocateFixed, MapPin } from "lucide-react";
import { DateStrip } from "./DateStrip";
import type { CalendarPeriod } from "./DateStrip";
import { FilterAccordion } from "./FilterAccordion";
import { FILTER_SECTIONS } from "./filterSections";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  setShiftSort,
  toggleDurationFilter,
  togglePartner,
} from "../../redux/shift/slice";
import {
  selectSelectedDurationFilters,
  selectSelectedPartners,
  selectShiftSort,
} from "../../redux/shift/selectors";
import type { ShiftDurationFilter } from "../../redux/shift/types";
import type { UserCoordinates } from "./useGeolocation";
import type { ApproximateLocation } from "../../api/location";

interface FilterSidebarProps {
  coordinates: UserCoordinates | null;
  isLocating: boolean;
  locationError: string | null;
  onRequestLocation: () => void;
  approximateLocation: ApproximateLocation | null;
  isLoadingApproximateLocation: boolean;
  hasSelectedCategory: boolean;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  calendarPeriod: CalendarPeriod;
  onCalendarPeriodChange: (period: CalendarPeriod) => void;
  partnerOptions: { label: string; count: number }[];
}

export function FilterSidebar({
  coordinates,
  isLocating,
  locationError,
  onRequestLocation,
  approximateLocation,
  isLoadingApproximateLocation,
  hasSelectedCategory,
  selectedDate,
  onSelectDate,
  calendarPeriod,
  onCalendarPeriodChange,
  partnerOptions,
}: FilterSidebarProps) {
  const dispatch = useAppDispatch();
  const sort = useAppSelector(selectShiftSort);
  const selectedPartners = useAppSelector(selectSelectedPartners);
  const selectedDurationFilters = useAppSelector(selectSelectedDurationFilters);
  const sections = FILTER_SECTIONS.filter((section) => section.id !== "service").map((section) =>
    section.id === "partner" ? { ...section, count: partnerOptions.length, options: partnerOptions } : section,
  );
  const sortLabels = { relevance: "За релевантністю", date_asc: "Спочатку найближчі за датою", date_desc: "Спочатку пізніші за датою", price_desc: "Спочатку дорожчі", nearest: "Найближчі до мене" } as const;
  const sortByLabel = Object.fromEntries(Object.entries(sortLabels).map(([key, label]) => [label, key])) as Record<string, "relevance" | "date_asc" | "date_desc" | "price_desc" | "nearest">;

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
            : approximateLocation?.city
              ? `Ваше місто: ${approximateLocation.city}`
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
        {!hasSelectedCategory && (
          <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-bg-muted px-4 py-5 text-center">
            <p className="text-sm font-semibold text-ink">Оберіть категорію</p>
            <p className="mt-2 text-xs leading-5 text-text-muted">
              Після цього з’являться доступні зміни та додаткові фільтри.
            </p>
          </div>
        )}
        {hasSelectedCategory && (
          <>
            {sections.map((section) => (
              <FilterAccordion
                key={section.id}
                section={section}
                onRequestPreciseLocation={onRequestLocation}
                selectedOption={section.id === "sort" ? sortLabels[sort] : undefined}
                onSelectOption={section.id === "sort" ? (label) => dispatch(setShiftSort(label ? sortByLabel[label] : "relevance")) : undefined}
                onToggleOption={
                  section.id === "partner"
                    ? (partner) => dispatch(togglePartner(partner))
                    : section.id === "duration"
                        ? (filter) => dispatch(toggleDurationFilter(filter as ShiftDurationFilter))
                        : undefined
                }
                selectedOptions={
                  section.id === "partner"
                    ? selectedPartners
                    : section.id === "duration"
                        ? selectedDurationFilters
                        : undefined
                }
              />
            ))}
          </>
        )}
      </div>
    </aside>
  );
}

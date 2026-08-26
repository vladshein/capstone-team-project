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
import type { Category } from "../../api/categories";

interface FilterSidebarProps {
  content: "date" | "filters";
  onRequestLocation: () => void;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  calendarPeriod: CalendarPeriod;
  onCalendarPeriodChange: (period: CalendarPeriod) => void;
  partnerOptions: { label: string; count: number }[];
  categories: Category[];
}

export function FilterSidebar({
  content,
  onRequestLocation,
  selectedDate,
  onSelectDate,
  calendarPeriod,
  onCalendarPeriodChange,
  partnerOptions,
  categories,
}: FilterSidebarProps) {
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

  if (content === "date") {
    return (
      <DateStrip
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        period={calendarPeriod}
        onPeriodChange={onCalendarPeriodChange}
      />
    );
  }

  return (
    <div className="relative z-[1000] grid grid-cols-2 gap-2 sm:grid-cols-4">
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
  );
}

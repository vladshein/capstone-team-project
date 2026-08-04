import { DateStrip } from "./DateStrip";
import { FilterAccordion } from "./FilterAccordion";
import { FILTER_SECTIONS } from "./filterSections";

export function FilterSidebar() {
  return (
    <aside className="flex flex-col gap-4">
      <DateStrip />
      <div className="rounded-[var(--radius-card)] border border-border bg-bg p-4">
        {FILTER_SECTIONS.map((section) => (
          <FilterAccordion key={section.id} section={section} />
        ))}
      </div>
    </aside>
  );
}
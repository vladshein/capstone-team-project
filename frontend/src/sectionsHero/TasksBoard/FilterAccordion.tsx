import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FilterSection } from "./filterSections";

export function FilterAccordion({ section }: { section: FilterSection }) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggleOption = (label: string) => setChecked((c) => ({ ...c, [label]: !c[label] }));

  return (
    <div className="border-b border-border py-3 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-sm font-medium"
      >
        <span>
          {section.label}
          {section.count ? <span className="text-text-subtle"> ({section.count})</span> : null}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-2">
          {section.options.map((opt) => (
            <label
              key={opt.label}
              className="flex cursor-pointer items-center justify-between text-sm text-text"
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!checked[opt.label]}
                  onChange={() => toggleOption(opt.label)}
                  className="h-4 w-4 rounded border-border text-accent accent-accent"
                />
                {opt.label}
              </span>
              {opt.count ? <span className="text-xs text-text-subtle">{opt.count}</span> : null}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
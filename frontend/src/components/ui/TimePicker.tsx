import { useEffect, useRef, useState } from "react";
import { Clock3 } from "lucide-react";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  ariaLabel: string;
}

const minutes = ["00", "15", "30", "45"];

/** 24-годинний picker, незалежний від системного AM/PM формату браузера. */
export function TimePicker({ value, onChange, className = "", ariaLabel }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [draft, setDraft] = useState(value);
  const rootRef = useRef<HTMLDivElement>(null);
  const [hour, minute] = value.split(":");

  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const openPicker = () => {
    setSelectedHour(Number(hour));
    setIsOpen(true);
  };

  const chooseMinute = (nextMinute: string) => {
    if (selectedHour === null) return;
    onChange(`${String(selectedHour).padStart(2, "0")}:${nextMinute}`);
    setIsOpen(false);
  };

  const commitManualTime = () => {
    const match = draft.trim().match(/^(\d{1,2})(?::(\d{0,2}))?$/);
    if (!match) {
      setDraft(value);
      return;
    }

    const nextHour = Number(match[1]);
    const nextMinute = Number(match[2] || "0");
    if (nextHour > 23 || nextMinute > 59) {
      setDraft(value);
      return;
    }

    onChange(`${String(nextHour).padStart(2, "0")}:${String(nextMinute).padStart(2, "0")}`);
  };

  return (
    <div ref={rootRef} className="relative mt-1">
      <div className={`flex min-h-[44px] w-full items-center rounded-[var(--radius-card)] border border-border bg-bg pr-2 text-sm transition-colors focus-within:border-accent hover:border-accent ${className}`}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitManualTime}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitManualTime();
              (event.currentTarget as HTMLInputElement).blur();
            }
          }}
          inputMode="numeric"
          aria-label={ariaLabel}
          className="min-w-0 flex-1 bg-transparent px-3 outline-none"
        />
        <button type="button" onClick={openPicker} aria-label={`Відкрити ${ariaLabel.toLowerCase()}`} aria-haspopup="dialog" aria-expanded={isOpen} className="rounded p-1 text-text-subtle transition-colors hover:text-accent-text">
          <Clock3 className="h-4 w-4" />
        </button>
      </div>

      {isOpen && (
        <div role="dialog" aria-label={`${ariaLabel}: вибір часу`} className="absolute z-30 mt-2 w-52 overflow-hidden rounded-[var(--radius-card)] border border-border bg-bg shadow-lg">
          <div className="grid grid-cols-2 border-b border-border bg-bg-muted px-3 py-2 text-xs font-medium text-text-muted">
            <span>Години</span>
            <span>Хвилини</span>
          </div>
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="max-h-48 overflow-y-auto p-1.5">
            {Array.from({ length: 24 }, (_, index) => {
              const isSelected = selectedHour === index;
              return (
                <button key={index} type="button" onClick={() => setSelectedHour(index)} className={`flex min-h-8 w-full items-center rounded-md px-3 text-sm transition-colors ${isSelected ? "bg-accent text-white" : "hover:bg-accent/10 hover:text-accent-text"}`}>
                  {String(index).padStart(2, "0")}
                </button>
              );
            })}
            </div>
            <div className="p-1.5">
            {minutes.map((item) => (
              <button key={item} type="button" onClick={() => chooseMinute(item)} disabled={selectedHour === null} className={`flex min-h-8 w-full items-center rounded-md px-3 text-sm transition-colors ${minute === item ? "bg-accent/10 text-accent-text" : "hover:bg-accent/10 hover:text-accent-text"} disabled:cursor-not-allowed disabled:opacity-40`}>
                :{item}
              </button>
            ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

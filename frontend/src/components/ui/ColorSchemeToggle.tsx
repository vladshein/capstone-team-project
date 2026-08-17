import { MoonStar, Sun } from "lucide-react";
import { useState } from "react";

import { getColorScheme, setColorScheme, type ColorScheme } from "../../theme/applyTheme";

export function ColorSchemeToggle() {
  const [scheme, setScheme] = useState<ColorScheme>(() => getColorScheme());
  const isDark = scheme === "dark";

  const toggleScheme = () => {
    const nextScheme: ColorScheme = isDark ? "light" : "dark";
    setColorScheme(nextScheme);
    setScheme(nextScheme);
  };

  return (
    <button
      type="button"
      onClick={toggleScheme}
      aria-pressed={isDark}
      aria-label={isDark ? "Увімкнути світлу тему" : "Увімкнути темну тему"}
      title={isDark ? "Світла тема" : "Темна тема"}
      className={`group relative flex h-9 w-[68px] items-center rounded-[var(--radius-pill)] border p-1 transition-colors duration-500 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
        isDark
          ? "border-border bg-bg-inverse"
          : "border-accent/20 bg-accent/15"
      }`}
    >
      <span
        aria-hidden="true"
        className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-bg shadow-sm transition-transform duration-500 ease-[cubic-bezier(.34,1.56,.64,1)] ${
          isDark ? "translate-x-[32px]" : "translate-x-0"
        }`}
      >
        {isDark ? <MoonStar className="h-3.5 w-3.5 text-accent" /> : <Sun className="h-3.5 w-3.5 text-warning" />}
      </span>
    </button>
  );
}

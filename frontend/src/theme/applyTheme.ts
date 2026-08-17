/**
 * Викликається один раз, до рендеру React (імпортується першим рядком у main.tsx).
 * Тема визначається змінною середовища VITE_THEME, яку Vite підхоплює
 * з .env.<mode> файлу відповідно до прапорця --mode у package.json-скрипті.
 */
export type ThemeName = "teal" | "indigo" | "emerald" | "violet";
export type ColorScheme = "light" | "dark";

const AVAILABLE_THEMES: ThemeName[] = ["teal", "indigo", "emerald", "violet"];
const DEFAULT_THEME: ThemeName = "teal";
const COLOR_SCHEME_STORAGE_KEY = "zmina.color-scheme";

export function getColorScheme(): ColorScheme {
  try {
    const saved = window.localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // localStorage може бути недоступний у приватному режимі браузера.
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function setColorScheme(scheme: ColorScheme) {
  document.documentElement.setAttribute("data-color-scheme", scheme);
  try {
    window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, scheme);
  } catch {
    // Перемикання працює в межах сесії навіть без збереження.
  }
}

export function applyTheme() {
  const requested = import.meta.env.VITE_THEME as ThemeName | undefined;
  const theme = AVAILABLE_THEMES.includes(requested as ThemeName)
    ? (requested as ThemeName)
    : DEFAULT_THEME;

  document.documentElement.setAttribute("data-theme", theme);
  setColorScheme(getColorScheme());
}

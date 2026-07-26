/**
 * Викликається один раз, до рендеру React (імпортується першим рядком у main.tsx).
 * Тема визначається змінною середовища VITE_THEME, яку Vite підхоплює
 * з .env.<mode> файлу відповідно до прапорця --mode у package.json-скрипті.
 */
export type ThemeName = "teal" | "indigo" | "emerald" | "violet";

const AVAILABLE_THEMES: ThemeName[] = ["teal", "indigo", "emerald", "violet"];
const DEFAULT_THEME: ThemeName = "teal";

export function applyTheme() {
  const requested = import.meta.env.VITE_THEME as ThemeName | undefined;
  const theme = AVAILABLE_THEMES.includes(requested as ThemeName)
    ? (requested as ThemeName)
    : DEFAULT_THEME;

  document.documentElement.setAttribute("data-theme", theme);
}
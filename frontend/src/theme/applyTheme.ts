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

/** Акцент бренду по темі — має збігатися з --color-*-500 у theme.css. */
const THEME_ACCENT: Record<ThemeName, string> = {
  teal: "#0ea89a",
  indigo: "#4f46e5",
  emerald: "#10b981",
  violet: "#7c3aed",
};

/**
 * Перемальовує favicon під активну тему (заливка = акцент теми).
 * Статичний /favicon.svg лишається як дефолт до виконання JS.
 */
function applyFavicon(theme: ThemeName) {
  const accent = THEME_ACCENT[theme];
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<rect width="64" height="64" rx="16" fill="${accent}"/>` +
    `<path d="M20 20h24v6.5L28.8 39.5H44V46H20v-6.5L35.2 26.5H20V20z" fill="#fff"/>` +
    `</svg>`;

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/svg+xml";
  link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

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
  applyFavicon(theme);
}

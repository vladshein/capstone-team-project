export interface FilterOption {
  id?: string | number;
  label: string;
  count?: number;
}

export interface FilterSection {
  id: string;
  label: string;
  count?: number;
  options: FilterOption[];
}

export const FILTER_SECTIONS: FilterSection[] = [
  {
    id: "sort",
    label: "Сортування",
    options: [
      { label: "За релевантністю" },
      { label: "Спочатку найближчі за датою" },
      { label: "Спочатку пізніші за датою" },
      { label: "Спочатку дорожчі" },
      { label: "Найближчі до мене" },
    ],
  },
  {
    id: "service",
    label: "Послуга",
    count: 14,
    options: [
      { label: "Склад", count: 5 },
      { label: "Кур'єр", count: 3 },
      { label: "Прибирання", count: 2 },
      { label: "Виробництво", count: 2 },
      { label: "Промо", count: 2 },
    ],
  },
  {
    id: "partner",
    label: "Партнер",
    count: 32,
    options: [
      { label: "Rozetka Fulfillment", count: 6 },
      { label: "Сільпо", count: 5 },
      { label: "АТБ", count: 4 },
      { label: "Glovo", count: 4 },
      { label: "Novus", count: 3 },
    ],
  },
  {
    id: "duration",
    label: "Тривалість",
    options: [
      { label: "До 4 год" },
      { label: "4–8 год" },
      { label: "Понад 8 год" },
    ],
  },
];

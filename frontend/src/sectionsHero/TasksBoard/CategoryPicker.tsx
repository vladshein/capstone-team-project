import {
  Bike,
  Car,
  Factory,
  HardHat,
  Headphones,
  HeartPulse,
  HouseHeart,
  LayoutGrid,
  PawPrint,
  PartyPopper,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Sprout,
  UtensilsCrossed,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

import type { Category } from "../../api/categories";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Ритейл та Торгівля": ShoppingBasket,
  "Громадське харчування (HoReCa)": UtensilsCrossed,
  "Логістика та Склади": Warehouse,
  "Доставка та Кур'єрські послуги": Bike,
  "Клінінг та Прибирання": Sparkles,
  "Виробництво та Пакування": Factory,
  "Промо та Події": PartyPopper,
  "Будівництво та Ремонт": HardHat,
  "Охорона та Безпека": ShieldCheck,
  "Сільське господарство": Sprout,
  "Офіс та Підтримка клієнтів": Headphones,
  "Домашній персонал": HouseHeart,
  "Краса та Здоров'я": HeartPulse,
  "Авто та Перевезення": Car,
  "Робота з тваринами": PawPrint,
};

const categoryTextures: Record<string, string> = {
  "Ритейл та Торгівля": "[background-image:linear-gradient(90deg,var(--color-accent)_1px,transparent_1px),linear-gradient(var(--color-accent)_1px,transparent_1px)] [background-size:22px_22px]",
  "Громадське харчування (HoReCa)": "[background-image:radial-gradient(var(--color-accent)_1.5px,transparent_1.5px)] [background-size:16px_16px]",
  "Логістика та Склади": "[background-image:repeating-linear-gradient(0deg,transparent_0,transparent_11px,var(--color-accent)_12px)]",
  "Доставка та Кур'єрські послуги": "[background-image:repeating-linear-gradient(135deg,transparent_0,transparent_12px,var(--color-accent)_13px,var(--color-accent)_15px,transparent_16px,transparent_28px)]",
  "Клінінг та Прибирання": "[background-image:radial-gradient(circle_at_20%_25%,var(--color-accent)_0_2px,transparent_2.5px),radial-gradient(circle_at_70%_65%,var(--color-accent)_0_4px,transparent_4.5px)] [background-size:42px_42px]",
  "Виробництво та Пакування": "[background-image:repeating-linear-gradient(45deg,transparent_0,transparent_9px,var(--color-accent)_10px,var(--color-accent)_11px)]",
  "Промо та Події": "[background-image:radial-gradient(var(--color-accent)_1px,transparent_1px)] [background-size:12px_12px]",
  "Будівництво та Ремонт": "[background-image:repeating-linear-gradient(135deg,transparent_0,transparent_10px,var(--color-accent)_11px,var(--color-accent)_13px)]",
  "Охорона та Безпека": "[background-image:linear-gradient(45deg,var(--color-accent)_1px,transparent_1px),linear-gradient(-45deg,var(--color-accent)_1px,transparent_1px)] [background-size:20px_20px]",
  "Сільське господарство": "[background-image:repeating-linear-gradient(165deg,transparent_0,transparent_12px,var(--color-accent)_13px,var(--color-accent)_14px)]",
  "Офіс та Підтримка клієнтів": "[background-image:linear-gradient(90deg,var(--color-accent)_1px,transparent_1px)] [background-size:18px_18px]",
  "Домашній персонал": "[background-image:radial-gradient(circle_at_25%_30%,var(--color-accent)_0_3px,transparent_3.5px)] [background-size:28px_28px]",
  "Краса та Здоров'я": "[background-image:repeating-radial-gradient(circle_at_0_100%,transparent_0,transparent_12px,var(--color-accent)_13px,transparent_14px)]",
  "Авто та Перевезення": "[background-image:repeating-linear-gradient(90deg,var(--color-accent)_0_8px,transparent_8px_16px)]",
  "Робота з тваринами": "[background-image:radial-gradient(var(--color-accent)_1.5px,transparent_1.5px)] [background-size:18px_18px]",
};

interface CategoryPickerProps {
  categories: Category[];
  onSelect: (categoryId: string | number) => void;
}

export function CategoryPicker({ categories, onSelect }: CategoryPickerProps) {
  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-accent-text">Оберіть напрям</p>
          <h3 className="mt-1 font-heading text-2xl font-bold tracking-tight text-ink">
            Яка робота вам підходить?
          </h3>
        </div>
        <p className="text-sm text-text-muted">{categories.length} категорій</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {categories.map((category) => {
          const Icon = CATEGORY_ICONS[category.name] ?? LayoutGrid;
          const texture = categoryTextures[category.name] ?? categoryTextures["Ритейл та Торгівля"];

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.id)}
              className="group relative flex min-h-32 flex-col items-center overflow-hidden rounded-[var(--radius-card)] border border-border bg-[linear-gradient(145deg,var(--color-bg)_0%,var(--color-bg-muted)_100%)] p-4 text-center transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
            >
              <span className={`pointer-events-none absolute inset-0 opacity-[0.07] ${texture}`} />
              <span className="relative flex h-10 w-10 items-center justify-center rounded-[var(--radius-card)] bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                <Icon className="h-5 w-5" />
              </span>
              <span className="relative mt-4 text-sm font-semibold leading-5 text-ink">{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

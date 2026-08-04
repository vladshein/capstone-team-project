// import { useEffect, useMemo, useState } from "react";
// import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
// import { getAllShifts, type Shift } from "../api/shifts";

// interface FilterOption {
//   label: string;
//   count?: number;
// }

// interface FilterSection {
//   id: string;
//   label: string;
//   count?: number;
//   options: FilterOption[];
// }

// const FILTER_SECTIONS: FilterSection[] = [
//   {
//     id: "sort",
//     label: "Сортування",
//     options: [
//       { label: "За релевантністю" },
//       { label: "Спочатку дорожчі" },
//       { label: "Найближчі до мене" },
//     ],
//   },
//   {
//     id: "service",
//     label: "Послуга",
//     count: 14,
//     options: [
//       { label: "Склад", count: 5 },
//       { label: "Кур'єр", count: 3 },
//       { label: "Прибирання", count: 2 },
//       { label: "Виробництво", count: 2 },
//       { label: "Промо", count: 2 },
//     ],
//   },
//   {
//     id: "partner",
//     label: "Партнер",
//     count: 32,
//     options: [
//       { label: "Rozetka Fulfillment", count: 6 },
//       { label: "Сільпо", count: 5 },
//       { label: "АТБ", count: 4 },
//       { label: "Glovo", count: 4 },
//       { label: "Novus", count: 3 },
//     ],
//   },
//   {
//     id: "start",
//     label: "Початок завдання",
//     options: [
//       { label: "Найближчим часом" },
//       { label: "Сьогодні" },
//       { label: "Завтра" },
//       { label: "Цього тижня" },
//     ],
//   },
//   {
//     id: "duration",
//     label: "Тривалість",
//     options: [
//       { label: "До 4 год" },
//       { label: "4–8 год" },
//       { label: "Понад 8 год" },
//     ],
//   },
// ];

// const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("uk-UA", { weekday: "short" });
// const TODAY_LABEL_FORMATTER = new Intl.DateTimeFormat("uk-UA", {
//   day: "numeric",
//   month: "long",
// });
// const SELECTED_LABEL_FORMATTER = new Intl.DateTimeFormat("uk-UA", {
//   day: "numeric",
//   month: "long",
//   weekday: "long",
// });
// const TIME_FORMATTER = new Intl.DateTimeFormat("uk-UA", {
//   hour: "2-digit",
//   minute: "2-digit",
// });
// const PRICE_FORMATTER = new Intl.NumberFormat("uk-UA", {
//   maximumFractionDigits: 0,
// });

// function buildWeekStrip(centerOffset: number) {
//   const today = new Date();
//   return Array.from({ length: 7 }, (_, i) => {
//     const d = new Date(today);
//     d.setDate(today.getDate() - 3 + i + centerOffset);
//     return d;
//   });
// }

// function formatTimeRange(startTime: string, endTime: string) {
//   try {
//     return `${TIME_FORMATTER.format(new Date(startTime))}–${TIME_FORMATTER.format(
//       new Date(endTime),
//     )}`;
//   } catch {
//     return "";
//   }
// }

// function formatPriceLabel(shift: Shift) {
//   const start = new Date(shift.startTime).getTime();
//   const end = new Date(shift.endTime).getTime();
//   const hours = Number.isFinite(start) && Number.isFinite(end) ? Math.max((end - start) / 3_600_000, 0) : 0;
//   const total = hours * shift.hourlyRate + (shift.bonusRate ?? 0);
//   return total > 0 ? `~${PRICE_FORMATTER.format(total)}₴` : `${PRICE_FORMATTER.format(shift.hourlyRate)}₴/год`;
// }

// function DateStrip() {
//   const [weekOffset, setWeekOffset] = useState(0);
//   const [selected, setSelected] = useState(0);
//   const today = new Date();
//   const days = useMemo(() => buildWeekStrip(weekOffset), [weekOffset]);
//   const selectedDate = days[selected] ?? today;

//   return (
//     <div className="rounded-[var(--radius-card)] border border-border bg-bg p-4">
//       <div className="flex items-center justify-between">
//         <p className="font-heading text-sm font-semibold capitalize">
//           {SELECTED_LABEL_FORMATTER.format(selectedDate)}
//         </p>
//         <div className="flex items-center gap-1">
//           <button
//             type="button"
//             aria-label="Попередній тиждень"
//             onClick={() => setWeekOffset((w) => w - 7)}
//             className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-pill)] text-text-muted hover:text-accent"
//           >
//             <ChevronLeft className="h-4 w-4" />
//           </button>
//           <button
//             type="button"
//             aria-label="Наступний тиждень"
//             onClick={() => setWeekOffset((w) => w + 7)}
//             className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-pill)] text-text-muted hover:text-accent"
//           >
//             <ChevronRight className="h-4 w-4" />
//           </button>
//         </div>
//       </div>

//       <div className="mt-3 grid grid-cols-7 gap-1.5">
//         {days.map((d, i) => {
//           const isSelected = i === selected;
//           return (
//             <button
//               key={d.toISOString()}
//               type="button"
//               onClick={() => setSelected(i)}
//               className={`flex flex-col items-center rounded-[var(--radius-card)] py-2 text-xs font-medium transition-colors ${
//                 isSelected
//                   ? "bg-accent text-white"
//                   : "text-text-muted hover:bg-bg-muted"
//               }`}
//             >
//               <span className="capitalize">{WEEKDAY_FORMATTER.format(d)}</span>
//               <span className="mt-1 font-mono text-sm">{d.getDate()}</span>
//             </button>
//           );
//         })}
//       </div>

//       <p className="mt-3 text-xs text-text-subtle">
//         Сьогодні {TODAY_LABEL_FORMATTER.format(today)}
//       </p>
//     </div>
//   );
// }

// function FilterAccordion({ section }: { section: FilterSection }) {
//   const [open, setOpen] = useState(false);
//   const [checked, setChecked] = useState<Record<string, boolean>>({});

//   const toggleOption = (label: string) =>
//     setChecked((c) => ({ ...c, [label]: !c[label] }));

//   return (
//     <div className="border-b border-border py-3 last:border-b-0">
//       <button
//         type="button"
//         onClick={() => setOpen((o) => !o)}
//         aria-expanded={open}
//         className="flex w-full items-center justify-between text-sm font-medium"
//       >
//         <span>
//           {section.label}
//           {section.count ? (
//             <span className="text-text-subtle"> ({section.count})</span>
//           ) : null}
//         </span>
//         <ChevronDown
//           className={`h-4 w-4 text-text-muted transition-transform ${
//             open ? "rotate-180" : ""
//           }`}
//         />
//       </button>

//       {open && (
//         <div className="mt-3 flex flex-col gap-2">
//           {section.options.map((opt) => (
//             <label
//               key={opt.label}
//               className="flex cursor-pointer items-center justify-between text-sm text-text"
//             >
//               <span className="flex items-center gap-2">
//                 <input
//                   type="checkbox"
//                   checked={!!checked[opt.label]}
//                   onChange={() => toggleOption(opt.label)}
//                   className="h-4 w-4 rounded border-border text-accent accent-accent"
//                 />
//                 {opt.label}
//               </span>
//               {opt.count ? (
//                 <span className="text-xs text-text-subtle">{opt.count}</span>
//               ) : null}
//             </label>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// function TaskCard({ shift }: { shift: Shift }) {
//   const companyName = shift.Location?.Company?.name ?? "";
//   const logoInitial = companyName ? companyName[0].toUpperCase() : "?";
//   const title = shift.description || shift.JobPosition?.title || shift.Category?.name || "Завдання";

//   return (
//     <div className="flex flex-col justify-between rounded-[var(--radius-card)] border border-border bg-bg p-5">
//       <div>
//         <div className="flex items-start justify-between gap-3">
//           <h3 className="font-heading text-base font-semibold leading-snug">
//             {title}
//           </h3>
//           <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-pill)] bg-bg-muted font-heading text-sm font-semibold text-ink">
//             {logoInitial}
//           </span>
//         </div>
//         <p className="mt-2 text-xs text-text-muted">
//           {formatTimeRange(shift.startTime, shift.endTime)}
//         </p>
//         <p className="mt-3 text-sm font-medium">{companyName}</p>
//         <p className="text-sm text-text-muted">{shift.Location?.address}</p>
//       </div>

//       <div className="mt-5 flex items-end justify-between gap-3 border-t border-border pt-4">
//         <div>
//           <p className="font-mono text-base font-semibold text-accent">
//             {formatPriceLabel(shift)}
//           </p>
//           <p className="text-xs text-text-subtle">ви отримаєте за завдання</p>
//         </div>
//         <button
//           type="button"
//           className="min-h-[44px] shrink-0 rounded-[var(--radius-pill)] bg-accent px-5 text-sm font-medium text-white hover:bg-accent-hover"
//         >
//           Взяти завдання
//         </button>
//       </div>
//     </div>
//   );
// }

// export function TasksBoard() {
//   const [shifts, setShifts] = useState<Shift[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     let cancelled = false;

//     async function loadShifts() {
//       setIsLoading(true);
//       setError(null);
//       try {
//         const response = await getAllShifts({ page: 1, limit: 20 });
//         if (!cancelled) {
//           setShifts(response.data);
//         }
//       } catch (err) {
//         if (!cancelled) {
//           setError("Не вдалося завантажити завдання. Спробуйте пізніше.");
//         }
//       } finally {
//         if (!cancelled) {
//           setIsLoading(false);
//         }
//       }
//     }

//     loadShifts();
//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   return (
//     <section className="mx-auto max-w-7xl px-4 py-[calc(var(--space-section)-1.5rem)] sm:px-6 sm:py-[calc(var(--space-section)-1rem)] md:px-8 md:py-[var(--space-section)]">
//       <h2 className="font-heading text-3xl font-bold uppercase leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">
//         Більше 10 000 завдань щодня
//       </h2>

//       <div className="mt-8 grid gap-6 sm:mt-10 lg:grid-cols-[280px_1fr] lg:gap-8">
//         <aside className="flex flex-col gap-4">
//           <DateStrip />
//           <div className="rounded-[var(--radius-card)] border border-border bg-bg p-4">
//             {FILTER_SECTIONS.map((section) => (
//               <FilterAccordion key={section.id} section={section} />
//             ))}
//           </div>
//         </aside>

//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
//           {isLoading && (
//             <p className="text-sm text-text-muted sm:col-span-2">Завантаження завдань…</p>
//           )}
//           {error && (
//             <p className="text-sm text-red-600 sm:col-span-2">{error}</p>
//           )}
//           {!isLoading && !error && shifts.length === 0 && (
//             <p className="text-sm text-text-muted sm:col-span-2">Наразі немає доступних завдань.</p>
//           )}
//           {!isLoading &&
//             !error &&
//             shifts.map((shift) => <TaskCard key={shift.id} shift={shift} />)}
//         </div>
//       </div>
//     </section>
//   );
// }
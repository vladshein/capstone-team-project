import { useRef } from "react";
import { FilterSidebar } from "./FilterSidebar";
import { TaskCard } from "./TaskCard";
import { useInfiniteShifts } from "./useInfiniteShifts";

export function TasksBoard() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { shifts, isLoading, isLoadingMore, error, hasMore, sentinelRef } =
    useInfiniteShifts(scrollContainerRef);

  return (
    <section className="mx-auto max-w-7xl px-4 py-[calc(var(--space-section)-1.5rem)] sm:px-6 sm:py-[calc(var(--space-section)-1rem)] md:px-8 md:py-[var(--space-section)]">
      <h2 className="font-heading text-3xl font-bold uppercase leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">
        Більше 10 000 завдань щодня
      </h2>

      <div className="mt-8 grid gap-6 sm:mt-10 lg:grid-cols-[280px_1fr] lg:gap-8">
        <FilterSidebar />

        <div
          ref={scrollContainerRef}
          className="max-h-[640px] overflow-y-auto pr-1"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {isLoading && (
              <p className="text-sm text-text-muted sm:col-span-2">Завантаження завдань…</p>
            )}
            {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
            {!isLoading && !error && shifts.length === 0 && (
              <p className="text-sm text-text-muted sm:col-span-2">Наразі немає доступних завдань.</p>
            )}

            {!isLoading && shifts.map((shift) => <TaskCard key={shift.id} shift={shift} />)}

            {!isLoading && hasMore && (
              <div ref={sentinelRef} className="h-1 sm:col-span-2" aria-hidden />
            )}
            {isLoadingMore && (
              <p className="text-sm text-text-muted sm:col-span-2">Завантаження ще завдань…</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
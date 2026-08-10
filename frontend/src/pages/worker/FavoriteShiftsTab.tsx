import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Heart } from "lucide-react";
import { Link } from "react-router-dom";

import { getShiftById, type Shift } from "../../api/shifts";
import { Loader } from "../../components/ui/Loader";
import { useFavoriteShifts } from "../../hooks/useFavoriteShifts";

const CARDS_PER_PAGE = 8;

export function FavoriteShiftsTab() {
  const { favoriteIds, toggleFavorite, removeFavorite } = useFavoriteShifts();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const savedShiftIds = useMemo(
    () =>
      favoriteIds
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0),
    [favoriteIds],
  );
  const totalPages = Math.ceil(savedShiftIds.length / CARDS_PER_PAGE);
  const activePage = Math.min(currentPage, Math.max(totalPages, 1));
  const pageShiftIds = useMemo(
    () =>
      savedShiftIds.slice(
        (activePage - 1) * CARDS_PER_PAGE,
        activePage * CARDS_PER_PAGE,
      ),
    [activePage, savedShiftIds],
  );

  useEffect(() => {
    let isCurrent = true;

    if (pageShiftIds.length === 0) {
      setShifts([]);
      setIsLoading(false);
      return () => {
        isCurrent = false;
      };
    }

    setIsLoading(true);
    void Promise.all(pageShiftIds.map((id) => getShiftById(id).catch(() => null))).then(
      (savedShifts) => {
        if (isCurrent) {
          const availableShifts = savedShifts.filter(
            (shift): shift is Shift =>
              shift !== null && new Date(shift.endTime).getTime() > Date.now(),
          );
          const finishedShiftIds = savedShifts
            .filter(
              (shift): shift is Shift =>
                shift !== null && new Date(shift.endTime).getTime() <= Date.now(),
            )
            .map((shift) => shift.id);

          finishedShiftIds.forEach(removeFavorite);
          setShifts(availableShifts);
          setIsLoading(false);
        }
      },
    );

    return () => {
      isCurrent = false;
    };
  }, [pageShiftIds, removeFavorite]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, Math.max(totalPages, 1)));
  }, [totalPages]);

  if (isLoading && shifts.length === 0) {
    return <Loader label="Завантажуємо збережені зміни…" />;
  }

  if (favoriteIds.length === 0) {
    return <EmptyFavoritesState />;
  }

  if (shifts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-text-subtle">
        <p>Збережені зміни вже недоступні.</p>
        <a href="/#zavdannia" className="font-medium text-accent-text hover:underline">
          Перейти до біржі змін →
        </a>
      </div>
    );
  }

  return (
    <div className="p-4">
      {isLoading && <Loader label="Оновлюємо збережені зміни…" size="sm" />}
      <div className="grid gap-4 sm:grid-cols-2">
      {shifts.map((shift) => {
        const companyName = shift.Location?.Company?.name ?? "Компанія";
        const title = shift.JobPosition?.title ?? shift.Category?.name ?? "Зміна";
        const startTime = new Date(shift.startTime);
        const endTime = new Date(shift.endTime);
        const duration = Math.max((endTime.getTime() - startTime.getTime()) / 3_600_000, 0);
        const payment = duration * (Number(shift.hourlyRate) || 0) + (Number(shift.bonusRate) || 0);

        return (
          <article key={shift.id} className="flex flex-col rounded-[var(--radius-card)] border border-border bg-bg p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-heading font-semibold text-ink">{title}</p>
                <p className="mt-1 text-sm text-text-muted">{companyName}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleFavorite(shift.id)}
                aria-label="Прибрати зміну зі збережених"
                className="-mr-2 -mt-2 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-pill)] text-accent transition-colors hover:bg-accent/10"
              >
                <Heart className="h-5 w-5 fill-current" />
              </button>
            </div>
            <p className="mt-4 text-sm text-text">
              {Number.isNaN(startTime.getTime())
                ? "Дата уточнюється"
                : new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "long" }).format(startTime)}
              {!Number.isNaN(startTime.getTime()) && !Number.isNaN(endTime.getTime())
                ? ` · ${startTime.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}—${endTime.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}`
                : ""}
            </p>
            <p className="mt-1 text-sm text-text-muted">
              {[shift.Location?.address, shift.Location?.city]
                .filter(Boolean)
                .join(", ") || "Адреса уточнюється"}
            </p>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
              <span className="font-mono font-bold text-accent">~{Math.round(payment).toLocaleString("uk-UA")} ₴</span>
              <Link
                to={`/shifts/${shift.id}`}
                className="inline-flex min-h-[40px] items-center gap-1 rounded-[var(--radius-pill)] bg-ink px-4 text-sm font-medium text-white transition-colors hover:bg-accent"
              >
                Детальніше <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        );
      })}
      </div>
      {totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-1.5" aria-label="Пагінація збережених змін">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => page - 1)}
            disabled={activePage === 1}
            className="min-h-[40px] rounded-[var(--radius-pill)] border border-border px-3 text-sm text-text-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            Назад
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => setCurrentPage(pageNumber)}
              aria-current={pageNumber === activePage ? "page" : undefined}
              className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-pill)] text-sm font-medium transition-colors ${pageNumber === activePage ? "bg-accent text-white" : "border border-border text-text hover:border-accent"}`}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCurrentPage((page) => page + 1)}
            disabled={activePage === totalPages}
            className="min-h-[40px] rounded-[var(--radius-pill)] border border-border px-3 text-sm text-text-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            Далі
          </button>
        </nav>
      )}
    </div>
  );
}

export default FavoriteShiftsTab;

function EmptyFavoritesState() {
  return (
    <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-text-subtle">
      <Heart className="h-7 w-7 text-accent" />
      <p>Тут з’являться зміни, які ви зберегли.</p>
      <a href="/#zavdannia" className="font-medium text-accent-text hover:underline">
        Перейти до біржі змін →
      </a>
    </div>
  );
}

import { Star, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Loader } from "../../components/ui/Loader";
import type { BusinessWorkersStatistics } from "../../redux/business-statistics/types";

interface BusinessWorkersTableProps {
  data: BusinessWorkersStatistics | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  onPageChange: (page: number) => void;
  onRetry: () => void;
}

const dateFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function BusinessWorkersTable({
  data,
  isLoading,
  error,
  page,
  onPageChange,
  onRetry,
}: BusinessWorkersTableProps) {
  if (isLoading && !data) return <Loader label="Завантажуємо воркерів…" />;

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-sm text-danger">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-ink hover:bg-bg-muted"
        >
          Спробувати ще раз
        </button>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="flex min-h-52 flex-col items-center justify-center px-6 py-10 text-center">
        <Users className="h-8 w-8 text-accent/80" />
        <h2 className="mt-4 font-heading text-lg font-semibold">Поки немає воркерів</h2>
        <p className="mt-2 max-w-md text-sm text-text-muted">
          Виконавці, які подадуть заявку на ваші зміни, з'являться тут.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-bg shadow-sm">
      <div className="divide-y divide-border">
        {data.data.map((worker) => {
          const name =
            worker.firstName || worker.lastName
              ? `${worker.firstName ?? ""} ${worker.lastName ?? ""}`.trim()
              : "Виконавець";

          return (
            <article
              key={worker.workerId}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/10 text-sm font-bold text-accent">
                  {worker.avatarUrl ? (
                    <img src={worker.avatarUrl} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    name.charAt(0) || "?"
                  )}
                </div>
                <div>
                  <Link
                    to={`/workers/${worker.workerId}`}
                    className="font-heading font-semibold transition-colors hover:text-accent-text hover:underline"
                  >
                    {name}
                  </Link>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-text-muted">
                    <Star className="h-3.5 w-3.5 fill-highlight text-highlight" />
                    {worker.rating > 0 ? worker.rating.toFixed(2) : "ще немає відгуків"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-text-muted">
                <span>
                  Заявок: <strong className="font-medium text-text">{worker.totalApplications}</strong>
                </span>
                <span>
                  Відпрацював: <strong className="font-medium text-text">{worker.completedShifts}</strong>
                </span>
                <span>
                  Неявки: <strong className="font-medium text-text">{worker.noShow}</strong>
                </span>
                {worker.lastActivityAt && (
                  <span>Востаннє: {dateFormatter.format(new Date(worker.lastActivityAt))}</span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {data.totalPages > 1 && (
        <nav className="flex items-center justify-center gap-1.5 px-5 py-5" aria-label="Пагінація воркерів">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="min-h-[40px] rounded-[var(--radius-pill)] border border-border px-3 text-sm text-text-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            Назад
          </button>
          {Array.from({ length: data.totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => onPageChange(pageNumber)}
              aria-current={pageNumber === page ? "page" : undefined}
              className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-pill)] text-sm font-medium transition-colors ${
                pageNumber === page
                  ? "bg-accent text-white"
                  : "border border-border text-text hover:border-accent"
              }`}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page === data.totalPages}
            className="min-h-[40px] rounded-[var(--radius-pill)] border border-border px-3 text-sm text-text-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            Далі
          </button>
        </nav>
      )}
    </div>
  );
}

export default BusinessWorkersTable;

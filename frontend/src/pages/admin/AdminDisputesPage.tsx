import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Gavel,
  Search,
  ShieldAlert,
} from "lucide-react";
import {
  getAdminDisputes,
  getAdminDisputeStatusCounts,
  type Dispute,
  type DisputeStatus,
} from "../../api/disputes";

const statusMeta: Record<DisputeStatus, { label: string; className: string }> =
  {
    open: { label: "Новий", className: "bg-amber-100 text-amber-800" },
    awaiting_response: {
      label: "Очікуємо відповідь",
      className: "bg-violet-100 text-violet-800",
    },
    under_review: {
      label: "Передано адміністратору",
      className: "bg-sky-100 text-sky-800",
    },
    resolved: {
      label: "Вирішено",
      className: "bg-emerald-100 text-emerald-800",
    },
    closed: {
      label: "Врегульовано сторонами",
      className: "bg-emerald-100 text-emerald-800",
    },
    appealed: { label: "Апеляція", className: "bg-rose-100 text-rose-800" },
  };
const reasonLabels = {
  payment: "Неповна або відсутня виплата",
  no_show: "Неявка на зміну",
  late_cancellation: "Скасування в день зміни",
  work_quality: "Якість виконаної роботи",
  other: "Інше",
};
const partyName = (party: Dispute["Initiator"], companyName?: string) =>
  party.WorkerProfile
    ? `${party.WorkerProfile.firstName} ${party.WorkerProfile.lastName}`
    : party.role === "business_client"
      ? (companyName ?? party.email)
      : party.email;
const money = (amount: string | null) =>
  amount ? `${Number(amount).toLocaleString("uk-UA")} ₴` : "—";

export default function AdminDisputesPage() {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [filter, setFilter] = useState<"all" | DisputeStatus>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusCounts, setStatusCounts] = useState<
    Record<DisputeStatus, number>
  >({
    open: 0,
    awaiting_response: 0,
    under_review: 0,
    resolved: 0,
    closed: 0,
    appealed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setError("");
    void getAdminDisputes({
      page,
      status: filter === "all" ? undefined : filter,
      search: query.trim() || undefined,
    })
      .then((response) => {
        if (!isCurrent) return;
        setDisputes(response.data);
        setTotalPages(response.totalPages);
        setTotalItems(response.totalItems);
      })
      .catch((requestError) => {
        if (!isCurrent) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Не вдалося завантажити спори.",
        );
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [filter, page, query, reloadKey]);

  useEffect(() => {
    void getAdminDisputeStatusCounts()
      .then(setStatusCounts)
      .catch(() => {});
  }, [reloadKey]);

  const count = (status?: DisputeStatus) =>
    status
      ? statusCounts[status]
      : Object.values(statusCounts).reduce((total, value) => total + value, 0);
  const selectFilter = (nextFilter: "all" | DisputeStatus) => {
    setFilter(nextFilter);
    setPage(1);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-[var(--space-section)] sm:px-6 md:px-8">
      <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-bg-muted px-3 py-1.5 text-xs font-semibold text-text-muted">
            <Gavel className="h-3.5 w-3.5 text-accent" />
            Адміністрування
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Вирішення спорів
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
            Перевіряйте звернення та ухвалюйте неупереджені рішення між
            компаніями й виконавцями.
          </p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-semibold">{count("open")} нових</span> спорів
          очікують первинного розгляду
        </div>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(
          [
            [undefined, "Усього спорів", FileText, "text-text"],
            ["open", "Нові звернення", ShieldAlert, "text-amber-600"],
            ["under_review", "Передано адміністратору", Clock3, "text-sky-600"],
            ["resolved", "Вирішено", CheckCircle2, "text-emerald-600"],
          ] as const
        ).map(([status, label, Icon, color]) => (
          <button
            key={status ?? "all"}
            type="button"
            onClick={() => selectFilter(status ?? "all")}
            className={`rounded-[var(--radius-card)] border bg-bg p-5 text-left shadow-sm transition hover:border-accent ${filter === (status ?? "all") ? "border-accent ring-1 ring-accent" : "border-border"}`}
          >
            <Icon className={`h-5 w-5 ${color}`} />
            <p className="mt-5 text-3xl font-semibold text-ink">
              {count(status)}
            </p>
            <p className="mt-1 text-sm text-text-muted">{label}</p>
          </button>
        ))}
      </div>
      <div className="mt-8 overflow-hidden rounded-[var(--radius-card)] border border-border bg-bg shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold">Звернення</h2>
            <p className="text-sm text-text-muted">
              {totalItems} за поточним пошуком · сторінка {page} з {totalPages}
            </p>
          </div>
          <label className="relative block sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Пошук за номером або учасником"
              className="min-h-[42px] w-full rounded-[var(--radius-pill)] border border-border bg-bg py-2 pl-10 pr-4 text-sm outline-none focus:border-accent"
            />
          </label>
        </div>
        <div className="divide-y divide-border">
          {isLoading && (
            <p className="p-12 text-center text-sm text-text-muted">
              Завантажуємо спори…
            </p>
          )}
          {error && (
            <div className="p-8 text-center">
              <p className="text-sm text-danger">{error}</p>
              <button
                type="button"
                onClick={() => setReloadKey((current) => current + 1)}
                className="mt-4 rounded-[var(--radius-pill)] border border-border px-4 py-2 text-sm font-medium"
              >
                Спробувати ще раз
              </button>
            </div>
          )}
          {disputes.map((dispute) => {
            const meta = statusMeta[dispute.status];
            const companyName = dispute.Shift.Location?.Company?.name;
            return (
              <button
                key={dispute.id}
                type="button"
                onClick={() => navigate(`/admin/disputes/${dispute.id}`)}
                className="grid w-full gap-3 p-5 text-left transition hover:bg-bg-muted md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.2fr)_auto_auto] md:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-accent-text">
                      DSP-{dispute.id}
                    </span>
                    <span
                      className={`rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-semibold ${meta.className}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-2 font-semibold text-ink">
                    {reasonLabels[dispute.reason]}
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
                    {companyName ?? "Компанія"} ·{" "}
                    {partyName(dispute.Initiator, companyName)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-text">
                    {dispute.Shift.JobPosition?.title ?? "Зміна"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-text-muted">
                    {dispute.description}
                  </p>
                </div>
                <div className="md:text-right">
                  <p className="font-semibold text-ink">
                    {money(dispute.disputedAmount)}
                  </p>
                  <p className="mt-1 text-xs text-text-subtle">
                    {new Date(dispute.created_at).toLocaleDateString("uk-UA")}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-text-subtle md:justify-self-end" />
              </button>
            );
          })}
          {!isLoading && !error && disputes.length === 0 && (
            <p className="p-12 text-center text-sm text-text-muted">
              За цими параметрами спорів не знайдено.
            </p>
          )}
        </div>
        {!isLoading && !error && totalPages > 1 && (
          <nav
            className="flex items-center justify-between gap-3 border-t border-border px-5 py-4"
            aria-label="Сторінки спорів"
          >
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="inline-flex min-h-[40px] items-center gap-1 rounded-[var(--radius-pill)] border border-border px-3 text-sm font-medium text-text transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ChevronLeft className="h-4 w-4" />
              Назад
            </button>
            <span className="text-sm text-text-muted">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={page === totalPages}
              className="inline-flex min-h-[40px] items-center gap-1 rounded-[var(--radius-pill)] border border-border px-3 text-sm font-medium text-text transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-45"
            >
              Далі
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        )}
      </div>
    </section>
  );
}

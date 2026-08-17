import { useEffect, useState } from "react";
import { CalendarDays, Clock3, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import {
  cancelShiftApplication,
  getMyShiftApplications,
  type WorkerShiftApplication,
} from "../../api/shifts";
import { formatShiftDate, formatTimeRange } from "../../sectionsHero/TasksBoard/formatters";
import { Modal } from "../../components/ui/Modal";
import { Loader } from "../../components/ui/Loader";
import { ReviewModal } from "../../components/reviews/ReviewModal";
import { createReview, updateReview } from "../../api/reviews";

const APPLICATIONS_PER_PAGE = 8;
type BookingScope = "active" | "completed" | "archive";

const statusMeta = {
  pending: { label: "Заявка на розгляді", className: "bg-warning/10 text-warning" },
  approved: { label: "Підтверджено компанією", className: "bg-accent/10 text-accent-text" },
  rejected: { label: "Відхилено", className: "bg-danger/10 text-danger" },
  completed: { label: "Завершено", className: "bg-accent/10 text-accent-text" },
  no_show: { label: "Неявка", className: "bg-danger/10 text-danger" },
} as const;

export function BookingsTab() {
  const [applications, setApplications] = useState<WorkerShiftApplication[]>([]);
  const [scope, setScope] = useState<BookingScope>("active");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [applicationToCancel, setApplicationToCancel] = useState<WorkerShiftApplication | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [applicationToReview, setApplicationToReview] = useState<WorkerShiftApplication | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);

    void getMyShiftApplications(page, APPLICATIONS_PER_PAGE, undefined, scope)
      .then((response) => {
        if (!isCurrent) return;
        setApplications(response.data);
        setTotalPages(response.totalPages);
      })
      .catch((error: unknown) => {
        if (isCurrent) toast.error(error instanceof Error ? error.message : "Не вдалося завантажити бронювання.");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [page, reloadKey, scope]);

  const handleScopeChange = (nextScope: BookingScope) => {
    if (nextScope === scope) return;
    setScope(nextScope);
    setPage(1);
    setApplicationToCancel(null);
  };

  const handleCancel = async (application: WorkerShiftApplication) => {
    setCancellingId(application.id);
    try {
      await cancelShiftApplication(application.id);
      toast.success("Заявку відкликано.");
      setApplicationToCancel(null);
      setReloadKey((value) => value + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не вдалося відкликати заявку.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleReviewSubmit = async ({ rating, comment }: { rating: number; comment?: string }) => {
    if (!applicationToReview) return;
    setIsSubmittingReview(true);
    setReviewError(null);
    try {
      const review = applicationToReview.Shift.Reviews?.[0];
      if (review) {
        await updateReview(review.id, { rating, comment });
        toast.success("Відгук оновлено.");
      } else {
        await createReview(applicationToReview.shiftId, { rating, comment });
        toast.success("Відгук збережено.");
      }
      setApplicationToReview(null);
      setReloadKey((value) => value + 1);
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Не вдалося зберегти відгук.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const isInitialLoading = isLoading && applications.length === 0;
  const content = isInitialLoading ? (
    <Loader label="Завантажуємо ваші заявки…" />
  ) : applications.length === 0 ? (
    <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-text-subtle">
      <p>{scope === "active" ? "У вас поки немає активних заявок на зміни." : scope === "completed" ? "Виконаних заявок поки немає." : "Архів заявок поки порожній."}</p>
      {scope === "active" && (
        <a href="/#zavdannia" className="font-medium text-accent-text hover:underline">Знайти зміну →</a>
      )}
    </div>
  ) : (
    <div className="divide-y divide-border">
      {isLoading && <Loader label="Оновлюємо заявки…" size="sm" />}
      {applications.map((application) => {
        const shift = application.Shift;
        const status = statusMeta[application.status];
        const canCancel = application.status === "pending"
          && new Date(shift.startTime) > new Date();
        const canReview = scope === "completed" && application.status === "completed";
        const review = shift.Reviews?.[0] ?? null;

        return (
          <article key={application.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link to={`/shifts/${shift.id}`} className="font-heading font-semibold text-ink transition-colors hover:text-accent-text hover:underline">
                  {shift.JobPosition?.title ?? shift.description ?? "Зміна"}
                </Link>
                <span className={`rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                  {status.label}
                </span>
              </div>
              <p className="mt-1 text-sm text-text-muted">{shift.Location?.Company?.name ?? "Компанія"}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-text-muted">
                <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-text-subtle" />{formatShiftDate(shift.startTime)}</span>
                <span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-text-subtle" />{formatTimeRange(shift.startTime, shift.endTime)}</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-text-subtle" />{shift.Location?.address}, {shift.Location?.city}</span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {canCancel && (
                <button
                  type="button"
                  onClick={() => setApplicationToCancel(application)}
                  disabled={cancellingId === application.id}
                  className="inline-flex min-h-[42px] items-center justify-center rounded-[var(--radius-pill)] px-4 text-sm font-medium text-danger transition-colors hover:bg-danger/10 disabled:cursor-wait disabled:opacity-60"
                >
                  {cancellingId === application.id ? "Скасовуємо…" : "Відкликати"}
                </button>
              )}
              {canReview && (
                <button
                  type="button"
                  onClick={() => { setReviewError(null); setApplicationToReview(application); }}
                  className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-[var(--radius-pill)] bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                >
                  {review ? "Редагувати відгук" : "Залишити відгук"}
                </button>
              )}
            </div>
          </article>
        );
      })}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-3 p-5" aria-label="Пагінація заявок">
          <button type="button" onClick={() => setPage((value) => value - 1)} disabled={page === 1} className="min-h-[40px] rounded-[var(--radius-pill)] border border-border px-3 text-sm text-text-muted disabled:opacity-40">Назад</button>
          <span className="text-sm text-text-muted">{page} / {totalPages}</span>
          <button type="button" onClick={() => setPage((value) => value + 1)} disabled={page === totalPages} className="min-h-[40px] rounded-[var(--radius-pill)] border border-border px-3 text-sm text-text-muted disabled:opacity-40">Далі</button>
        </nav>
      )}
    </div>
  );

  return (
    <>
      <div className="flex gap-5 border-b border-border px-5">
        <button type="button" onClick={() => handleScopeChange("active")} className={`min-h-[48px] border-b-2 px-1 text-sm font-medium transition-colors ${scope === "active" ? "border-accent text-accent-text" : "border-transparent text-text-muted hover:text-text"}`}>
          Активні
        </button>
        <button type="button" onClick={() => handleScopeChange("completed")} className={`min-h-[48px] border-b-2 px-1 text-sm font-medium transition-colors ${scope === "completed" ? "border-accent text-accent-text" : "border-transparent text-text-muted hover:text-text"}`}>
          Виконані
        </button>
        <button type="button" onClick={() => handleScopeChange("archive")} className={`min-h-[48px] border-b-2 px-1 text-sm font-medium transition-colors ${scope === "archive" ? "border-accent text-accent-text" : "border-transparent text-text-muted hover:text-text"}`}>
          Архів
        </button>
      </div>
      {content}
    <Modal
      isOpen={applicationToCancel !== null}
      onClose={() => {
        if (!cancellingId) setApplicationToCancel(null);
      }}
      title="Відкликати заявку?"
    >
      <p className="text-sm leading-6 text-text-muted">
        Компанія більше не розглядатиме вашу заявку на цю зміну. Ви зможете відгукнутися повторно, якщо вакансія залишиться відкритою.
      </p>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => setApplicationToCancel(null)}
          disabled={cancellingId !== null}
          className="min-h-[44px] rounded-[var(--radius-pill)] border border-border px-5 text-sm font-semibold text-text transition-colors hover:border-accent disabled:opacity-60"
        >
          Залишити заявку
        </button>
        <button
          type="button"
          onClick={() => applicationToCancel && handleCancel(applicationToCancel)}
          disabled={cancellingId !== null}
          className="min-h-[44px] rounded-[var(--radius-pill)] bg-danger px-5 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          {cancellingId !== null ? "Відкликаємо…" : "Відкликати"}
        </button>
      </div>
    </Modal>
    <ReviewModal
      isOpen={applicationToReview !== null}
      onClose={() => { if (!isSubmittingReview) setApplicationToReview(null); }}
      title="Оцініть компанію"
      description={`Як пройшла співпраця з ${applicationToReview?.Shift.Location?.Company?.name ?? "компанією"}?`}
      isSubmitting={isSubmittingReview}
      error={reviewError}
      initialReview={applicationToReview?.Shift.Reviews?.[0] ?? null}
      onSubmit={handleReviewSubmit}
    />
    </>
  );
}

export default BookingsTab;

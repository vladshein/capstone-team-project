import { useEffect, useState } from "react";
import { CalendarDays, ClipboardList, MapPin, Star } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";

import {
  completeBusinessShiftApplication,
  decideBusinessShiftApplication,
  getBusinessShiftApplications,
  markBusinessShiftApplicationNoShow,
  type BusinessShiftApplication,
} from "../../api/shifts";
import { Loader } from "../../components/ui/Loader";
import { Modal } from "../../components/ui/Modal";
import { ReviewModal } from "../../components/reviews/ReviewModal";
import { createReview } from "../../api/reviews";
import type { BusinessDashboardOutletContext } from "./BusinessDashboardPage";

const APPLICATIONS_PER_PAGE = 8;

export function BusinessApplicationsTab() {
  const { company, onApplicationsChanged } = useOutletContext<BusinessDashboardOutletContext>();
  const [applications, setApplications] = useState<BusinessShiftApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [applicationToMarkNoShow, setApplicationToMarkNoShow] = useState<BusinessShiftApplication | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{
    shiftId: number;
    workerName: string;
    isNoShow: boolean;
  } | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    void getBusinessShiftApplications(company.id, page, APPLICATIONS_PER_PAGE)
      .then((response) => {
        if (cancelled) return;
        setApplications(response.data);
        setTotalPages(response.totalPages);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Не вдалося завантажити заявки.");
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [company.id, page, reloadKey]);

  useEffect(() => { setPage(1); }, [company.id]);

  const handleDecision = async (
    applicationId: number,
    status: "approved" | "rejected",
  ) => {
    setProcessingId(applicationId);
    setError(null);
    try {
      await decideBusinessShiftApplication(applicationId, status);
      setReloadKey((key) => key + 1);
      onApplicationsChanged();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не вдалося оновити заявку.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCompletion = async (applicationId: number) => {
    setProcessingId(applicationId);
    setError(null);
    try {
      await completeBusinessShiftApplication(applicationId);
      const application = applications.find((item) => item.id === applicationId);
      const profile = application?.User.WorkerProfile;
      setReviewTarget(application ? {
        shiftId: application.Shift.id,
        workerName: profile ? `${profile.firstName} ${profile.lastName}` : "виконавця",
        isNoShow: false,
      } : null);
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не вдалося підтвердити виконання.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleNoShow = async () => {
    if (!applicationToMarkNoShow) return;
    setProcessingId(applicationToMarkNoShow.id);
    setError(null);
    try {
      await markBusinessShiftApplicationNoShow(applicationToMarkNoShow.id);
      const profile = applicationToMarkNoShow.User.WorkerProfile;
      setReviewTarget({
        shiftId: applicationToMarkNoShow.Shift.id,
        workerName: profile ? `${profile.firstName} ${profile.lastName}` : "виконавця",
        isNoShow: true,
      });
      setApplicationToMarkNoShow(null);
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не вдалося зафіксувати неявку.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReviewSubmit = async ({ rating, comment }: { rating: number; comment?: string }) => {
    if (!reviewTarget) return;
    setIsSubmittingReview(true);
    setError(null);
    try {
      await createReview(reviewTarget.shiftId, { rating, comment });
      setReviewTarget(null);
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не вдалося зберегти відгук.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) return <Loader label="Завантажуємо заявки…" />;
  if (applications.length === 0) {
    return (
      <div className="flex min-h-52 flex-col items-center justify-center px-6 py-10 text-center">
        <ClipboardList className="h-8 w-8 text-accent/80" />
        <h2 className="mt-4 font-heading text-lg font-semibold">Поки немає заявок</h2>
        <p className="mt-2 max-w-md text-sm text-text-muted">{error ?? "Відгуки виконавців з'являться тут після публікації зміни."}</p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-border">
      {applications.map((application) => {
        const profile = application.User.WorkerProfile;
        const workerName = profile ? `${profile.firstName} ${profile.lastName}` : "Виконавець";
        const schedule = new Date(application.Shift.startTime).toLocaleString("uk-UA", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
        const isApproved = application.status === "approved";
        const requiresCompletionDecision = isApproved && new Date(application.Shift.endTime) <= new Date();
        const canComplete = requiresCompletionDecision;
        const applicationLabel = requiresCompletionDecision
          ? "Потрібне рішення"
          : isApproved
            ? "Підтверджено"
            : "Нова заявка";
        const applicationLabelClass = requiresCompletionDecision
          ? "bg-warning/10 text-warning"
          : isApproved
            ? "bg-accent/10 text-accent-text"
            : "bg-warning/10 text-warning";

        return (
          <article key={application.id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Link to={`/workers/${application.User.id}`} className="font-heading font-semibold transition-colors hover:text-accent-text hover:underline">{workerName}</Link>
                <span className={`rounded-[var(--radius-pill)] px-3 py-1 text-xs font-medium ${applicationLabelClass}`}>{applicationLabel}</span>
              </div>
              <p className="mt-1 text-sm text-text-muted">
                На зміну: <Link to={`/shifts/${application.Shift.id}`} className="font-medium text-text transition-colors hover:text-accent-text hover:underline">{application.Shift.JobPosition.title}</Link>
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-text-muted">
                <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{schedule}</span>
                <span className="flex items-center gap-1.5"><Star className="h-4 w-4" />Рейтинг: {Number(profile?.rating) > 0 ? Number(profile?.rating).toFixed(2) : "ще немає відгуків"}</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{application.Shift.Location.city}, {application.Shift.Location.address}</span>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {application.status === "pending" && (
                <>
                <button
                  type="button"
                  onClick={() => handleDecision(application.id, "approved")}
                  disabled={processingId === application.id}
                  className="min-h-[40px] rounded-[var(--radius-pill)] bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60"
                >
                  {processingId === application.id ? "Зберігаємо…" : "Підтвердити"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision(application.id, "rejected")}
                  disabled={processingId === application.id}
                  className="min-h-[40px] rounded-[var(--radius-pill)] px-4 text-sm font-medium text-danger transition-colors hover:bg-danger/10 disabled:cursor-wait disabled:opacity-60"
                >
                  Відхилити
                </button>
                </>
              )}
              {isApproved && (
                <>
                <button
                  type="button"
                  onClick={() => handleCompletion(application.id)}
                  disabled={!canComplete || processingId === application.id}
                  title={canComplete ? undefined : "Доступно після завершення зміни"}
                  className="min-h-[40px] rounded-[var(--radius-pill)] bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processingId === application.id ? "Зберігаємо…" : "Підтвердити виконання"}
                </button>
                <button
                  type="button"
                  onClick={() => setApplicationToMarkNoShow(application)}
                  disabled={!canComplete || processingId === application.id}
                  title={canComplete ? undefined : "Доступно після завершення зміни"}
                  className="min-h-[40px] rounded-[var(--radius-pill)] px-4 text-sm font-medium text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Не з’явився
                </button>
                </>
              )}
            </div>
          </article>
        );
      })}
      </div>
      {totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-1.5 px-5 pb-5" aria-label="Пагінація заявок">
          <button type="button" onClick={() => setPage((value) => value - 1)} disabled={page === 1} className="min-h-[40px] rounded-[var(--radius-pill)] border border-border px-3 text-sm text-text-muted disabled:cursor-not-allowed disabled:opacity-40">Назад</button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} aria-current={pageNumber === page ? "page" : undefined} className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-pill)] text-sm font-medium transition-colors ${pageNumber === page ? "bg-accent text-white" : "border border-border text-text hover:border-accent"}`}>{pageNumber}</button>
          ))}
          <button type="button" onClick={() => setPage((value) => value + 1)} disabled={page === totalPages} className="min-h-[40px] rounded-[var(--radius-pill)] border border-border px-3 text-sm text-text-muted disabled:cursor-not-allowed disabled:opacity-40">Далі</button>
        </nav>
      )}

      <Modal
        isOpen={applicationToMarkNoShow !== null}
        onClose={() => { if (processingId === null) setApplicationToMarkNoShow(null); }}
        title="Позначити неявку?"
      >
        <p className="text-sm leading-6 text-text-muted">
          Заявка виконавця отримає статус «Неявка», а зміна буде закрита й переміщена в архів. Цю дію не можна скасувати.
        </p>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => setApplicationToMarkNoShow(null)} disabled={processingId !== null} className="min-h-[44px] rounded-[var(--radius-pill)] border border-border px-5 text-sm font-semibold text-text transition-colors hover:border-accent disabled:opacity-60">Повернутися</button>
          <button type="button" onClick={handleNoShow} disabled={processingId !== null} className="min-h-[44px] rounded-[var(--radius-pill)] bg-danger px-5 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-wait disabled:opacity-60">{processingId !== null ? "Зберігаємо…" : "Підтвердити неявку"}</button>
        </div>
      </Modal>

      <ReviewModal
        isOpen={reviewTarget !== null}
        onClose={() => { if (!isSubmittingReview) setReviewTarget(null); }}
        title={reviewTarget?.isNoShow ? "Оцініть виконавця після неявки" : "Оцініть виконання зміни"}
        description={reviewTarget?.isNoShow
          ? `Залиште відгук про ${reviewTarget.workerName}, щоб інші компанії бачили історію співпраці.`
          : `Як пройшла зміна з ${reviewTarget?.workerName}?`}
        isSubmitting={isSubmittingReview}
        error={error}
        onSubmit={handleReviewSubmit}
      />
    </>
  );
}

import { useEffect, useState } from "react";
import { CalendarDays, ClipboardList, MapPin, Pencil, Star, X } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";

import {
  cancelBusinessShift,
  getBusinessShifts,
  type BusinessShift,
  updateShift,
} from "../../api/shifts";
import { Loader } from "../../components/ui/Loader";
import { Modal } from "../../components/ui/Modal";
import { ReviewModal } from "../../components/reviews/ReviewModal";
import { createReview, updateReview } from "../../api/reviews";
import { formatTimeRange } from "../../sectionsHero/TasksBoard/formatters";
import type { BusinessDashboardOutletContext } from "./BusinessDashboardPage";
import { CreateShiftModal } from "./CreateShiftModal";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { createNewShift } from "../../redux/shift/actions";

interface BusinessShiftsTabProps {
  scope: "active" | "archive";
}

const SHIFTS_PER_PAGE = 8;

const emptyState = {
  active: {
    title: "Ще немає створених змін",
    description: "Створіть першу зміну, щоб знайти виконавця для вашої компанії.",
  },
  archive: {
    title: "Архів поки порожній",
    description: "Завершені та скасовані зміни з'являться тут.",
  },
};

const shiftStatus = {
  open: { label: "Відкрита", className: "bg-accent/10 text-accent-text" },
  booked: { label: "Заброньована", className: "bg-bg-muted text-text-muted" },
  in_progress: { label: "В роботі", className: "bg-warning/10 text-warning" },
  completed: { label: "Завершена", className: "bg-bg-muted text-text-muted" },
  cancelled: { label: "Скасована", className: "bg-danger/10 text-danger" },
} as const;

export function BusinessShiftsTab({ scope }: BusinessShiftsTabProps) {
  const { company, shiftsRefreshKey } = useOutletContext<BusinessDashboardOutletContext>();
  const dispatch = useAppDispatch();
  const isCreatingRepeat = useAppSelector((state) => state.shift.isCreating);
  const [shifts, setShifts] = useState<BusinessShift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [shiftToEdit, setShiftToEdit] = useState<BusinessShift | null>(null);
  const [shiftToCancel, setShiftToCancel] = useState<BusinessShift | null>(null);
  const [shiftToRepeat, setShiftToRepeat] = useState<BusinessShift | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{
    shift: BusinessShift;
    workerName: string;
    isNoShow: boolean;
    review: { id: string; rating: number; comment: string | null } | null;
  } | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void getBusinessShifts(company.id, scope, page, SHIFTS_PER_PAGE)
      .then((response) => {
        if (cancelled) return;
        setShifts(response.data);
        setTotalPages(response.totalPages);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Не вдалося завантажити зміни.");
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [company.id, page, reloadKey, scope, shiftsRefreshKey]);

  useEffect(() => { setPage(1); }, [company.id, scope]);

  const formatSchedule = (shift: BusinessShift) => {
    const date = new Date(shift.startTime);
    const dateLabel = date.toLocaleDateString("uk-UA", { day: "numeric", month: "long" });
    return `${dateLabel} · ${formatTimeRange(shift.startTime, shift.endTime)}`;
  };

  if (isLoading) return <Loader label="Завантажуємо зміни…" />;
  if (shifts.length === 0) {
    return (
      <div className="flex min-h-52 flex-col items-center justify-center px-6 py-10 text-center">
        <ClipboardList className="h-8 w-8 text-accent/80" />
        <h2 className="mt-4 font-heading text-lg font-semibold">{emptyState[scope].title}</h2>
        <p className="mt-2 max-w-md text-sm text-text-muted">{error ?? emptyState[scope].description}</p>
      </div>
    );
  }

  const canManage = (shift: BusinessShift) =>
    ["open", "booked"].includes(shift.status) && new Date(shift.startTime) > new Date();

  const handleEdit = async (payload: Parameters<typeof updateShift>[1]) => {
    if (!shiftToEdit) return;
    setIsSaving(true);
    setActionError(null);
    try {
      await updateShift(shiftToEdit.id, payload);
      setShiftToEdit(null);
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : "Не вдалося оновити зміну.");
      throw requestError;
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!shiftToCancel) return;
    setIsCancelling(true);
    setActionError(null);
    try {
      await cancelBusinessShift(shiftToCancel.id);
      setShiftToCancel(null);
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : "Не вдалося скасувати зміну.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReviewSubmit = async ({ rating, comment }: { rating: number; comment?: string }) => {
    if (!reviewTarget) return;
    setIsSubmittingReview(true);
    setActionError(null);
    try {
      const payload = { rating, comment };
      if (reviewTarget.review) {
        await updateReview(reviewTarget.review.id, payload);
      } else {
        await createReview(reviewTarget.shift.id, payload);
      }
      setReviewTarget(null);
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : "Не вдалося зберегти відгук.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleRepeat = async (payload: Parameters<typeof updateShift>[1]) => {
    await dispatch(createNewShift(payload)).unwrap();
    setShiftToRepeat(null);
    setReloadKey((key) => key + 1);
  };

  return (
    <>
      <div className="divide-y divide-border">
      {shifts.map((shift) => {
        const finalApplication = shift.ShiftApplications?.[0];
        const workerProfile = finalApplication?.User.WorkerProfile;
        const workerName = workerProfile ? `${workerProfile.firstName} ${workerProfile.lastName}` : "Виконавець";
        const review = shift.Reviews?.[0] ?? null;

        return (
        <article key={shift.id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/shifts/${shift.id}`}
                className="font-heading font-semibold transition-colors hover:text-accent-text hover:underline"
              >
                {shift.JobPosition.title}
              </Link>
              <span className={`w-fit rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-medium ${shiftStatus[shift.status]?.className ?? "bg-bg-muted text-text-muted"}`}>
                {shiftStatus[shift.status]?.label ?? shift.status}
              </span>
              {scope === "archive" && finalApplication && (
                <span className={`w-fit rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-medium ${finalApplication.status === "no_show" ? "bg-danger/10 text-danger" : "bg-accent/10 text-accent-text"}`}>
                  {finalApplication.status === "no_show" ? "Неявка" : "Виконано"}
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-text-muted">
              <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{formatSchedule(shift)}</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{shift.Location.title}, {shift.Location.city}</span>
              {scope === "archive" && finalApplication?.User.WorkerProfile && (
                <Link to={`/workers/${finalApplication.User.id}`} className="font-medium transition-colors hover:text-accent-text hover:underline">
                  Виконавець: {workerName}
                </Link>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {scope === "active" && canManage(shift) && (
              <>
                {shift.status === "open" && (
                  <button type="button" onClick={() => { setActionError(null); setShiftToEdit(shift); }} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-[var(--radius-pill)] border border-border px-3 text-sm font-medium text-text transition-colors hover:border-accent hover:text-accent-text">
                    <Pencil className="h-3.5 w-3.5" />
                    Редагувати
                  </button>
                )}
                <button type="button" onClick={() => { setActionError(null); setShiftToCancel(shift); }} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-[var(--radius-pill)] px-3 text-sm font-medium text-danger transition-colors hover:bg-danger/10">
                  <X className="h-4 w-4" />
                  Скасувати
                </button>
              </>
            )}
            {scope === "archive" && finalApplication && (
              <button
                type="button"
                onClick={() => {
                  setActionError(null);
                  setReviewTarget({
                    shift,
                    workerName,
                    isNoShow: finalApplication.status === "no_show",
                    review,
                  });
                }}
                className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-[var(--radius-pill)] bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                {review && <Star className="h-3.5 w-3.5 fill-warning text-warning" />}
                {review ? "Редагувати відгук" : "Залишити відгук"}
              </button>
            )}
            {scope === "archive" && (
              <button type="button" onClick={() => { setActionError(null); setShiftToRepeat(shift); }} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-[var(--radius-pill)] border border-border px-3 text-sm font-medium text-text transition-colors hover:border-accent hover:text-accent-text">
                Повторити зміну
              </button>
            )}
          </div>
        </article>
        );
      })}
      </div>
      {totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-1.5 px-5 pb-5" aria-label="Пагінація змін">
          <button type="button" onClick={() => setPage((value) => value - 1)} disabled={page === 1} className="min-h-[40px] rounded-[var(--radius-pill)] border border-border px-3 text-sm text-text-muted disabled:cursor-not-allowed disabled:opacity-40">Назад</button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} aria-current={pageNumber === page ? "page" : undefined} className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-pill)] text-sm font-medium transition-colors ${pageNumber === page ? "bg-accent text-white" : "border border-border text-text hover:border-accent"}`}>{pageNumber}</button>
          ))}
          <button type="button" onClick={() => setPage((value) => value + 1)} disabled={page === totalPages} className="min-h-[40px] rounded-[var(--radius-pill)] border border-border px-3 text-sm text-text-muted disabled:cursor-not-allowed disabled:opacity-40">Далі</button>
        </nav>
      )}

      <CreateShiftModal
        isOpen={shiftToEdit !== null}
        companyId={company.id}
        locations={company.Locations ?? []}
        isSubmitting={isSaving}
        serverError={actionError}
        initialShift={shiftToEdit}
        onClose={() => { if (!isSaving) setShiftToEdit(null); }}
        onSubmit={handleEdit}
        onLocationCreated={async () => undefined}
      />

      <CreateShiftModal
        isOpen={shiftToRepeat !== null}
        companyId={company.id}
        locations={company.Locations ?? []}
        isSubmitting={isCreatingRepeat}
        serverError={actionError}
        initialShift={shiftToRepeat}
        isDuplicate
        onClose={() => { if (!isCreatingRepeat) setShiftToRepeat(null); }}
        onSubmit={handleRepeat}
        onLocationCreated={async () => undefined}
      />

      <Modal isOpen={shiftToCancel !== null} onClose={() => { if (!isCancelling) setShiftToCancel(null); }} title="Скасувати зміну?">
        <p className="text-sm leading-6 text-text-muted">
          Виконавці, які подали заявку, отримають статус «Відхилено». Повернути зміну після скасування не вийде.
        </p>
        {actionError && <p className="mt-3 text-sm text-danger">{actionError}</p>}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => setShiftToCancel(null)} disabled={isCancelling} className="min-h-[44px] rounded-[var(--radius-pill)] border border-border px-5 text-sm font-semibold text-text transition-colors hover:border-accent disabled:opacity-60">Не скасовувати</button>
          <button type="button" onClick={handleCancel} disabled={isCancelling} className="min-h-[44px] rounded-[var(--radius-pill)] bg-danger px-5 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-wait disabled:opacity-60">{isCancelling ? "Скасовуємо…" : "Скасувати зміну"}</button>
        </div>
      </Modal>

      <ReviewModal
        isOpen={reviewTarget !== null}
        onClose={() => { if (!isSubmittingReview) setReviewTarget(null); }}
        title={reviewTarget?.isNoShow ? "Відгук про неявку" : "Оцініть виконавця"}
        description={reviewTarget?.isNoShow
          ? `Залиште відгук про ${reviewTarget.workerName}, щоб інші компанії бачили історію співпраці.`
          : `Як пройшла зміна з ${reviewTarget?.workerName}?`}
        isSubmitting={isSubmittingReview}
        error={actionError}
        initialReview={reviewTarget?.review}
        onSubmit={handleReviewSubmit}
      />
    </>
  );
}

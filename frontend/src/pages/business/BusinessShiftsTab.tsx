import { useEffect, useState } from "react";
import { CalendarDays, ClipboardList, MapPin, Pencil, X } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";

import {
  cancelBusinessShift,
  getBusinessShifts,
  type BusinessShift,
  updateShift,
} from "../../api/shifts";
import { Loader } from "../../components/ui/Loader";
import { Modal } from "../../components/ui/Modal";
import { formatTimeRange } from "../../sectionsHero/TasksBoard/formatters";
import type { BusinessDashboardOutletContext } from "./BusinessDashboardPage";
import { CreateShiftModal } from "./CreateShiftModal";

interface BusinessShiftsTabProps {
  scope: "active" | "archive";
}

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
  const [shifts, setShifts] = useState<BusinessShift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [shiftToEdit, setShiftToEdit] = useState<BusinessShift | null>(null);
  const [shiftToCancel, setShiftToCancel] = useState<BusinessShift | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void getBusinessShifts(company.id, scope)
      .then((data) => { if (!cancelled) setShifts(data); })
      .catch((requestError) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Не вдалося завантажити зміни.");
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [company.id, reloadKey, scope, shiftsRefreshKey]);

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

  return (
    <>
      <div className="divide-y divide-border">
      {shifts.map((shift) => (
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
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-text-muted">
              <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{formatSchedule(shift)}</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{shift.Location.title}, {shift.Location.city}</span>
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
          </div>
        </article>
      ))}
      </div>

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
    </>
  );
}

import { useEffect, useState } from "react";
import { ChevronRight, Gavel } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  getMyDisputes,
  type Dispute,
  type DisputeDecision,
  type DisputeStatus,
} from "../../api/disputes";
import { Loader } from "../ui/Loader";

const statusMeta: Record<DisputeStatus, { label: string; className: string }> =
  {
    open: {
      label: "Очікує погодження іншої сторони",
      className: "bg-amber-100 text-amber-800",
    },
    awaiting_response: {
      label: "Очікує відповіді",
      className: "bg-violet-100 text-violet-800",
    },
    under_review: {
      label: "Передано адміністратору",
      className: "bg-sky-100 text-sky-800",
    },
    resolved: {
      label: "Вирішений",
      className: "bg-emerald-100 text-emerald-800",
    },
    closed: {
      label: "Врегульовано сторонами",
      className: "bg-emerald-100 text-emerald-800",
    },
    appealed: { label: "Оскаржений", className: "bg-rose-100 text-rose-800" },
  };

const decisionLabels: Record<DisputeDecision, string> = {
  pay_worker_full: "Повна виплата виконавцю",
  pay_worker_partial: "Часткова виплата виконавцю",
  refund_company: "Повернення компанії",
  no_action: "Без фінансових змін",
  cancel_shift_no_fault: "Скасувати без санкцій для сторін",
};

const money = (amount: string | null) =>
  amount ? `${Number(amount).toLocaleString("uk-UA")} ₴` : null;

export function MyDisputesTab() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isCurrent = true;
    void getMyDisputes()
      .then((response) => {
        if (isCurrent) setDisputes(response.data);
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Не вдалося завантажити спори.",
          );
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  if (isLoading) return <Loader label="Завантажуємо спори…" />;

  if (!disputes.length) {
    return (
      <div className="flex min-h-52 flex-col items-center justify-center px-6 py-10 text-center">
        <Gavel className="h-8 w-8 text-accent" />
        <h2 className="mt-4 font-heading text-lg font-semibold">
          Спорів ще немає
        </h2>
        <p className="mt-2 max-w-md text-sm text-text-muted">
          Тут з’являться ваші звернення щодо завершених змін і рішення за ними.
        </p>
      </div>
    );
  }

  return (
    <section>
      <header className="border-b border-border px-5 py-5">
        <h1 className="font-heading text-xl font-bold text-ink">Спори</h1>
        <p className="mt-1 text-sm text-text-muted">
          Усі звернення та рішення платформи в одному списку.
        </p>
      </header>
      <div className="divide-y divide-border">
        {disputes.map((dispute) => {
          const meta = statusMeta[dispute.status];
          return (
            <button
              key={dispute.id}
              type="button"
              onClick={() => navigate(`${dispute.id}`)}
              className="w-full p-5 text-left transition-colors hover:bg-bg-muted"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
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
                <span className="flex items-center gap-1 text-xs font-medium text-accent-text">
                  Деталі спору
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 font-heading font-semibold text-ink">
                {dispute.Shift.JobPosition?.title ?? "Зміна"}
                {dispute.Shift.Location?.Company?.name
                  ? ` · ${dispute.Shift.Location.Company.name}`
                  : ""}
              </p>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-text-muted">
                {dispute.description}
              </p>
              {dispute.status === "resolved" && dispute.decision && (
                <div className="mt-3 rounded-[var(--radius-card)] bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                  <span className="font-semibold">Рішення платформи: </span>
                  {decisionLabels[dispute.decision]}
                  {money(dispute.resolvedAmount)
                    ? ` · ${money(dispute.resolvedAmount)}`
                    : ""}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default MyDisputesTab;

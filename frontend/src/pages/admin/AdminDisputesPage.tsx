import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Gavel,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import {
  getAdminDisputes,
  getDispute,
  resolveDispute,
  type Dispute,
  type DisputeDecision,
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
      label: "На розгляді",
      className: "bg-sky-100 text-sky-800",
    },
    resolved: {
      label: "Вирішено",
      className: "bg-emerald-100 text-emerald-800",
    },
    closed: { label: "Закрито", className: "bg-slate-100 text-slate-700" },
    appealed: { label: "Апеляція", className: "bg-rose-100 text-rose-800" },
  };
const reasonLabels = {
  payment: "Неповна або відсутня виплата",
  no_show: "Неявка на зміну",
  late_cancellation: "Скасування в день зміни",
  work_quality: "Якість виконаної роботи",
  other: "Інше",
};
const decisions: Record<DisputeDecision, string> = {
  pay_worker_full: "Повна виплата виконавцю",
  pay_worker_partial: "Часткова виплата виконавцю",
  refund_company: "Повернення компанії",
  no_action: "Без фінансових змін",
  cancel_shift_no_fault: "Скасувати зміну без санкцій",
};
const participantName = (participant: Dispute["Initiator"]) =>
  participant.WorkerProfile
    ? `${participant.WorkerProfile.firstName} ${participant.WorkerProfile.lastName}`
    : participant.email;
const money = (amount: string | null) =>
  amount ? `${Number(amount).toLocaleString("uk-UA")} ₴` : "—";
const needsAmount = (decision: DisputeDecision) =>
  ["pay_worker_full", "pay_worker_partial", "refund_company"].includes(
    decision,
  );

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [filter, setFilter] = useState<"all" | DisputeStatus>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [decision, setDecision] = useState<DisputeDecision>("no_action");
  const [comment, setComment] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setIsLoading(true);
    setError("");
    try {
      setDisputes((await getAdminDisputes()).data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не вдалося завантажити спори.",
      );
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const visible = useMemo(
    () =>
      disputes.filter(
        (dispute) =>
          (filter === "all" || dispute.status === filter) &&
          `${dispute.id} ${dispute.Shift.Location?.Company?.name ?? ""} ${participantName(dispute.Initiator)} ${participantName(dispute.Respondent)} ${dispute.reason}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [disputes, filter, query],
  );
  const count = (status?: DisputeStatus) =>
    status
      ? disputes.filter((dispute) => dispute.status === status).length
      : disputes.length;
  const submit = async () => {
    if (!selected || !comment.trim() || (needsAmount(decision) && !amount))
      return;
    try {
      const resolved = await resolveDispute(selected.id, {
        decision,
        adminComment: comment,
        ...(needsAmount(decision) ? { resolvedAmount: Number(amount) } : {}),
      });
      setDisputes((items) =>
        items.map((item) => (item.id === resolved.id ? resolved : item)),
      );
      setSelected(null);
      setComment("");
      setAmount("");
      setDecision("no_action");
      toast.success("Рішення збережено в історії спору.");
    } catch (requestError) {
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Не вдалося зберегти рішення.",
      );
    }
  };
  const openDispute = async (dispute: Dispute) => {
    try {
      setSelected(await getDispute(dispute.id));
    } catch (requestError) {
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Не вдалося відкрити спір.",
      );
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-[var(--space-section)] sm:px-6 md:px-8">
      <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-bg-muted px-3 py-1.5 text-xs font-semibold text-text-muted">
            <Gavel className="h-3.5 w-3.5 text-accent" /> Адміністрування
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Вирішення спорів
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
            Перевіряйте докази та ухвалюйте неупереджені рішення між компаніями
            й виконавцями.
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
            ["under_review", "На розгляді", Clock3, "text-sky-600"],
            ["resolved", "Вирішено", CheckCircle2, "text-emerald-600"],
          ] as const
        ).map(([status, label, Icon, color]) => (
          <button
            key={status ?? "all"}
            type="button"
            onClick={() => setFilter(status ?? "all")}
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
              {visible.length} у поточному списку
            </p>
          </div>
          <label className="relative block sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
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
                onClick={() => void load()}
                className="mt-4 rounded-[var(--radius-pill)] border border-border px-4 py-2 text-sm font-medium"
              >
                Спробувати ще раз
              </button>
            </div>
          )}
          {visible.map((dispute) => (
            <DisputeRow
              key={dispute.id}
              dispute={dispute}
              onClick={() => void openDispute(dispute)}
            />
          ))}
          {!isLoading && !error && visible.length === 0 && (
            <p className="p-12 text-center text-sm text-text-muted">
              За цими параметрами спорів не знайдено.
            </p>
          )}
        </div>
      </div>
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40 p-0 sm:items-center sm:justify-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Розгляд спору"
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-[var(--radius-card)] bg-bg shadow-2xl sm:rounded-[var(--radius-card)]">
            <div className="flex items-start justify-between border-b border-border p-6">
              <div>
                <p className="font-mono text-xs font-semibold text-accent-text">
                  DSP-{selected.id}
                </p>
                <h2 className="mt-1 font-heading text-2xl font-bold">
                  {reasonLabels[selected.reason]}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full p-2 hover:bg-bg-muted"
                aria-label="Закрити"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-5 p-6">
              <div className="grid gap-4 rounded-[var(--radius-card)] bg-bg-muted p-4 sm:grid-cols-2">
                <Detail
                  label="Ініціатор"
                  value={participantName(selected.Initiator)}
                />
                <Detail
                  label="Інша сторона"
                  value={participantName(selected.Respondent)}
                />
                <Detail
                  label="Зміна"
                  value={selected.Shift.JobPosition?.title ?? "Зміна"}
                />
                <Detail
                  label="Сума спору"
                  value={money(selected.disputedAmount)}
                />
              </div>
              <div>
                <p className="text-sm font-semibold">Опис звернення</p>
                <p className="mt-1 text-sm leading-6 text-text-muted">
                  {selected.description}
                </p>
              </div>
              {!["resolved", "closed"].includes(selected.status) ? (
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold">Рішення</span>
                    <select
                      value={decision}
                      onChange={(event) =>
                        setDecision(event.target.value as DisputeDecision)
                      }
                      className="mt-2 min-h-[44px] w-full rounded-[var(--radius-card)] border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
                    >
                      {Object.entries(decisions).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {needsAmount(decision) && (
                    <label className="block">
                      <span className="text-sm font-semibold">
                        Сума рішення, ₴
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        className="mt-2 min-h-[44px] w-full rounded-[var(--radius-card)] border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
                      />
                    </label>
                  )}
                  <label className="block">
                    <span className="text-sm font-semibold">
                      Обґрунтування рішення
                    </span>
                    <textarea
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      placeholder="Опишіть рішення та його підстави…"
                      className="mt-2 min-h-28 w-full rounded-[var(--radius-card)] border border-border bg-bg p-3 text-sm outline-none focus:border-accent"
                    />
                  </label>
                </div>
              ) : (
                <div className="rounded-[var(--radius-card)] bg-emerald-50 p-4 text-sm text-emerald-800">
                  Цей спір уже вирішено. {selected.adminComment}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t border-border p-5">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="min-h-[42px] rounded-[var(--radius-pill)] border border-border px-5 text-sm font-medium"
              >
                Скасувати
              </button>
              {!["resolved", "closed"].includes(selected.status) && (
                <button
                  type="button"
                  disabled={
                    !comment.trim() || (needsAmount(decision) && !amount)
                  }
                  onClick={() => void submit()}
                  className="min-h-[42px] rounded-[var(--radius-pill)] bg-accent px-5 text-sm font-medium text-white disabled:opacity-40"
                >
                  Ухвалити рішення
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-text-subtle">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
function DisputeRow({
  dispute,
  onClick,
}: {
  dispute: Dispute;
  onClick: () => void;
}) {
  const meta = statusMeta[dispute.status];
  return (
    <button
      type="button"
      onClick={onClick}
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
          {dispute.Shift.Location?.Company?.name ?? "Компанія"} ·{" "}
          {participantName(dispute.Initiator)}
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
      <ChevronRight className="hidden h-5 w-5 text-text-subtle md:block" />
    </button>
  );
}

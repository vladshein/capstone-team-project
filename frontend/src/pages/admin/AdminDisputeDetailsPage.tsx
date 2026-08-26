import { useEffect, useState } from "react";
import { ArrowLeft, Gavel } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader } from "../../components/ui/Loader";
import {
  getDispute,
  resolveDispute,
  type Dispute,
  type DisputeDecision,
} from "../../api/disputes";

const decisions: Record<DisputeDecision, string> = {
  pay_worker_full: "Повна виплата виконавцю",
  pay_worker_partial: "Часткова виплата виконавцю",
  refund_company: "Повернення компанії",
  no_action: "Без фінансових змін",
  cancel_shift_no_fault: "Скасувати без санкцій для сторін",
};
const reasonLabels: Record<Dispute["reason"], string> = {
  payment: "Неповна або відсутня виплата",
  no_show: "Неявка на зміну",
  late_cancellation: "Скасування в день зміни",
  work_quality: "Якість виконання роботи",
  other: "Інше",
};
const eventLabels: Record<string, string> = {
  created: "Спір відкрито",
  message_added: "Додано пояснення",
  settled_by_parties: "Сторони врегулювали спір",
  escalated_to_admin: "Спір передано адміністратору",
  status_changed: "Адміністратор змінив статус",
  resolved: "Адміністратор ухвалив рішення",
};
const needsAmount = (decision: DisputeDecision) =>
  ["pay_worker_full", "pay_worker_partial", "refund_company"].includes(
    decision,
  );
const partyName = (party: Dispute["Initiator"], companyName?: string) =>
  party.WorkerProfile
    ? `${party.WorkerProfile.firstName} ${party.WorkerProfile.lastName}`
    : party.role === "business_client"
      ? (companyName ?? party.email)
      : party.email;
const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("uk-UA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
const money = (amount: string | null) =>
  amount ? `${Number(amount).toLocaleString("uk-UA")} ₴` : "—";
const statusLabel = (status: Dispute["status"]) =>
  status === "open"
    ? "Очікує погодження іншої сторони"
    : status === "under_review"
      ? "Передано адміністратору"
      : status === "resolved"
        ? "Вирішений"
        : status === "closed"
          ? "Врегульовано сторонами"
          : status;

export default function AdminDisputeDetailsPage() {
  const { disputeId } = useParams();
  const navigate = useNavigate();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [decision, setDecision] = useState<DisputeDecision>("no_action");
  const [comment, setComment] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!disputeId) return;
    void getDispute(Number(disputeId))
      .then(setDispute)
      .catch((error: unknown) =>
        toast.error(
          error instanceof Error ? error.message : "Не вдалося відкрити спір.",
        ),
      )
      .finally(() => setIsLoading(false));
  }, [disputeId]);
  const submit = async () => {
    if (!dispute || !comment.trim() || (needsAmount(decision) && !amount))
      return;
    setIsSubmitting(true);
    try {
      setDispute(
        await resolveDispute(dispute.id, {
          decision,
          adminComment: comment,
          ...(needsAmount(decision) ? { resolvedAmount: Number(amount) } : {}),
        }),
      );
      toast.success("Рішення збережено в історії спору.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Не вдалося зберегти рішення.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isLoading) return <Loader label="Завантажуємо спір…" fullScreen />;
  if (!dispute)
    return (
      <section className="mx-auto max-w-4xl px-4 py-[var(--space-section)]">
        <button
          type="button"
          onClick={() => navigate("/admin/disputes")}
          className="text-sm font-medium text-accent-text hover:underline"
        >
          ← До списку спорів
        </button>
        <p className="mt-8 text-text-muted">Спір не знайдено.</p>
      </section>
    );
  const companyName = dispute.Shift.Location?.Company?.name;
  const companyId = dispute.Shift.Location?.Company?.id;
  const participantLink = (participant: Dispute["Initiator"]) => {
    const label = partyName(participant, companyName);
    if (participant.role === "worker") {
      return (
        <Link
          to={`/workers/${participant.id}`}
          className="text-accent-text hover:underline"
        >
          {label}
        </Link>
      );
    }
    if (participant.role === "business_client" && companyId) {
      return (
        <Link
          to={`/companies/${companyId}`}
          className="text-accent-text hover:underline"
        >
          {label}
        </Link>
      );
    }
    return label;
  };
  const isClosed = ["resolved", "closed"].includes(dispute.status);
  return (
    <section className="mx-auto max-w-4xl px-4 py-[var(--space-section)] sm:px-6 md:px-8">
      <button
        type="button"
        onClick={() => navigate("/admin/disputes")}
        className="inline-flex items-center gap-2 text-sm font-medium text-accent-text hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        До списку спорів
      </button>
      <header className="mt-6 border-b border-border pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-accent-text">
          <Gavel className="h-4 w-4" />
          DSP-{dispute.id}
        </div>
        <h1 className="mt-2 font-heading text-3xl font-bold">Розгляд спору</h1>
        <p className="mt-2 text-sm text-text-muted">
          {dispute.Shift.JobPosition?.title ?? "Зміна"}
          {companyName ? ` · ${companyName}` : ""}
        </p>
      </header>
      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <main className="space-y-5">
          <section className="rounded-[var(--radius-card)] border border-border bg-bg p-5">
            <h2 className="font-heading text-lg font-bold">Звернення</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-text-subtle">Ініціатор</dt>
                <dd className="mt-1 font-medium">
                  {participantLink(dispute.Initiator)}
                </dd>
              </div>
              <div>
                <dt className="text-text-subtle">Інша сторона</dt>
                <dd className="mt-1 font-medium">
                  {participantLink(dispute.Respondent)}
                </dd>
              </div>
              <div>
                <dt className="text-text-subtle">Сума спору</dt>
                <dd className="mt-1 font-medium">
                  {money(dispute.disputedAmount)}
                </dd>
              </div>
              <div>
                <dt className="text-text-subtle">Статус</dt>
                <dd className="mt-1 font-medium">
                  {statusLabel(dispute.status)}
                </dd>
              </div>
              <div>
                <dt className="text-text-subtle">Причина</dt>
                <dd className="mt-1 font-medium">
                  {reasonLabels[dispute.reason]}
                </dd>
              </div>
              <div>
                <dt className="text-text-subtle">Зміна</dt>
                <dd className="mt-1 font-medium">
                  <Link
                    to={`/shifts/${dispute.Shift.id}`}
                    className="text-accent-text hover:underline"
                  >
                    {dispute.Shift.JobPosition?.title ?? "Зміна"}
                  </Link>
                </dd>
              </div>
            </dl>
            <h3 className="mt-5 text-sm font-semibold">Опис</h3>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-text-muted">
              {dispute.description}
            </p>
          </section>
          <section className="rounded-[var(--radius-card)] border border-border bg-bg p-5">
            <h2 className="font-heading text-lg font-bold">Перебіг спору</h2>
            <div className="mt-4 space-y-3">
              {dispute.Events?.length ? (
                dispute.Events.map((event) => (
                  <div key={event.id} className="flex gap-3 text-sm">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />
                    <div>
                      <p className="font-medium text-text">
                        {eventLabels[event.type] ?? event.type}
                      </p>
                      <p className="mt-0.5 text-xs text-text-subtle">
                        {event.Actor
                          ? partyName(event.Actor, companyName)
                          : "Система"}
                        {" · "}
                        {formatDateTime(event.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-text-muted">
                  Історія дій поки порожня.
                </p>
              )}
            </div>
          </section>
          <section className="rounded-[var(--radius-card)] border border-border bg-bg p-5">
            <h2 className="font-heading text-lg font-bold">
              Історія повідомлень
            </h2>
            <div className="mt-4 space-y-3">
              {dispute.Messages?.length ? (
                dispute.Messages.map((message) => (
                  <article
                    key={message.id}
                    className="rounded-[var(--radius-card)] bg-bg-muted p-3"
                  >
                    <p className="whitespace-pre-wrap text-sm leading-6">
                      {message.message}
                    </p>
                    <p className="mt-1.5 text-xs text-text-subtle">
                      {message.Author
                        ? participantLink(message.Author)
                        : "Учасник"}{" "}
                      · {formatDateTime(message.created_at)}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-text-muted">
                  Повідомлень поки немає.
                </p>
              )}
            </div>
          </section>
        </main>
        <aside className="h-fit rounded-[var(--radius-card)] border border-border bg-bg p-5">
          <h2 className="font-heading text-lg font-bold">
            {dispute.decision ? "Рішення" : "Результат"}
          </h2>
          {isClosed ? (
            <div className="mt-4 space-y-4">
              {dispute.decision && (
                <div className="rounded-[var(--radius-card)] bg-emerald-50 p-4 text-emerald-950">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                    Рішення адміністратора
                  </p>
                  <p className="mt-2 font-semibold">
                    {decisions[dispute.decision]}
                  </p>
                  {dispute.resolvedAmount && (
                    <p className="mt-1 text-sm">
                      Сума рішення: {money(dispute.resolvedAmount)}
                    </p>
                  )}
                </div>
              )}
              {!dispute.decision && (
                <p className="rounded-[var(--radius-card)] bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
                  Сторони врегулювали спір без рішення адміністратора.
                </p>
              )}
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-text-subtle">Ухвалив</dt>
                  <dd className="mt-1 font-medium">
                    {dispute.decision
                      ? (dispute.AssignedAdmin?.email ?? "Не вказано")
                      : "Сторони спору"}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-subtle">
                    {dispute.decision ? "Дата рішення" : "Дата закриття"}
                  </dt>
                  <dd className="mt-1 font-medium">
                    {dispute.resolvedAt
                      ? formatDateTime(dispute.resolvedAt)
                      : "Не вказано"}
                  </dd>
                </div>
                {dispute.decision && (
                  <div>
                    <dt className="text-text-subtle">Обґрунтування</dt>
                    <dd className="mt-1 whitespace-pre-wrap leading-6 text-text-muted">
                      {dispute.adminComment || "Коментар не додано."}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-semibold">
                Рішення
                <select
                  value={decision}
                  onChange={(event) =>
                    setDecision(event.target.value as DisputeDecision)
                  }
                  className="mt-2 min-h-[44px] w-full rounded-[var(--radius-card)] border border-border bg-bg px-3 font-normal outline-none focus:border-accent"
                >
                  {Object.entries(decisions).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              {needsAmount(decision) && (
                <label className="block text-sm font-semibold">
                  Сума рішення, ₴
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="mt-2 min-h-[44px] w-full rounded-[var(--radius-card)] border border-border bg-bg px-3 font-normal outline-none focus:border-accent"
                  />
                </label>
              )}
              <label className="block text-sm font-semibold">
                Обґрунтування
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Опишіть рішення та його підстави…"
                  className="mt-2 min-h-28 w-full rounded-[var(--radius-card)] border border-border bg-bg p-3 font-normal outline-none focus:border-accent"
                />
              </label>
              <button
                type="button"
                disabled={
                  isSubmitting ||
                  !comment.trim() ||
                  (needsAmount(decision) && !amount)
                }
                onClick={() => void submit()}
                className="min-h-[44px] w-full rounded-[var(--radius-pill)] bg-accent px-5 text-sm font-medium text-white disabled:opacity-50"
              >
                {isSubmitting ? "Зберігаємо…" : "Ухвалити рішення"}
              </button>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

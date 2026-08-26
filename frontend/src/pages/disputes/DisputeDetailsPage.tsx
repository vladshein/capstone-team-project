import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Gavel } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  addDisputeMessage,
  appealDispute,
  escalateDispute,
  getDispute,
  settleDispute,
  type Dispute,
  type DisputeDecision,
} from "../../api/disputes";
import { Loader } from "../../components/ui/Loader";
import { useAppSelector } from "../../redux/hooks";
import { selectUserInfo } from "../../redux/auth/selectors";

const statusMeta: Record<
  Dispute["status"],
  { label: string; className: string }
> = {
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
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("uk-UA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
const money = (amount: string | null) =>
  amount ? `${Number(amount).toLocaleString("uk-UA")} ₴` : "—";

export default function DisputeDetailsPage() {
  const { disputeId } = useParams();
  const navigate = useNavigate();
  const user = useAppSelector(selectUserInfo);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseAction, setResponseAction] = useState<
    "settle" | "escalate" | null
  >(null);
  const [appealMessage, setAppealMessage] = useState("");
  const [isAppealing, setIsAppealing] = useState(false);
  const listPath =
    user?.role === "business_client"
      ? "/dashboard/disputes"
      : "/cabinet/disputes";

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

  const submitMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!dispute || !message.trim()) return;
    setIsSubmitting(true);
    try {
      await addDisputeMessage(dispute.id, message.trim());
      setMessage("");
      setDispute(await getDispute(dispute.id));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Не вдалося додати пояснення.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const respond = async (action: "settle" | "escalate") => {
    if (!dispute) return;
    setResponseAction(action);
    try {
      setDispute(
        action === "settle"
          ? await settleDispute(dispute.id)
          : await escalateDispute(dispute.id),
      );
      toast.success(
        action === "settle"
          ? "Спір закрито за згодою сторін."
          : "Спір передано адміністратору.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Не вдалося оновити статус спору.",
      );
    } finally {
      setResponseAction(null);
    }
  };

  const appeal = async (event: FormEvent) => {
    event.preventDefault();
    if (!dispute || !appealMessage.trim()) return;
    setIsAppealing(true);
    try {
      setDispute(await appealDispute(dispute.id, appealMessage.trim()));
      setAppealMessage("");
      toast.success("Апеляцію передано адміністратору.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Не вдалося подати апеляцію.",
      );
    } finally {
      setIsAppealing(false);
    }
  };

  if (isLoading) return <Loader label="Завантажуємо спір…" />;
  if (!dispute) {
    return <p className="p-6 text-sm text-text-muted">Спір не знайдено.</p>;
  }

  const status = statusMeta[dispute.status];
  const isClosed = ["resolved", "closed"].includes(dispute.status);
  const canRespond =
    ["open", "awaiting_response"].includes(dispute.status) &&
    dispute.Respondent.id === user?.id;
  const canAppeal = dispute.status === "resolved";
  const companyName = dispute.Shift.Location?.Company?.name;
  const participantName = (participant: Dispute["Initiator"]) =>
    participant.WorkerProfile
      ? `${participant.WorkerProfile.firstName} ${participant.WorkerProfile.lastName}`
      : participant.role === "business_client"
        ? (companyName ?? participant.email)
        : participant.email;

  return (
    <section className="w-full p-5 sm:p-6 md:p-8">
      <button
        type="button"
        onClick={() => navigate(listPath)}
        className="inline-flex items-center gap-2 text-sm font-medium text-accent-text hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        До всіх спорів
      </button>
      <header className="mt-6 border-b border-border pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-semibold text-accent-text">
            <Gavel className="h-4 w-4" />
            DSP-{dispute.id}
          </span>
          <span
            className={`rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-semibold ${status.className}`}
          >
            {status.label}
          </span>
        </div>
        <h1 className="mt-3 font-heading text-3xl font-bold">
          Спір щодо зміни
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          <Link
            to={`/shifts/${dispute.Shift.id}`}
            className="hover:text-accent-text hover:underline"
          >
            {dispute.Shift.JobPosition?.title ?? "Зміна"}
          </Link>
          {companyName ? ` · ${companyName}` : ""}
        </p>
      </header>

      <div className="mt-6 space-y-5">
        {isClosed && dispute.status === "resolved" && dispute.decision && (
          <section className="rounded-[var(--radius-card)] border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-semibold text-emerald-900">
              Рішення платформи
            </p>
            <p className="mt-2 font-heading text-lg font-bold text-emerald-950">
              {decisionLabels[dispute.decision]}
            </p>
            {dispute.resolvedAmount && (
              <p className="mt-1 text-sm font-medium text-emerald-900">
                Сума рішення: {money(dispute.resolvedAmount)}
              </p>
            )}
            {dispute.adminComment && (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-emerald-950">
                {dispute.adminComment}
              </p>
            )}
          </section>
        )}
        {dispute.status === "closed" && (
          <section className="rounded-[var(--radius-card)] border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
            <p className="text-sm font-semibold text-emerald-900">
              Врегульовано сторонами
            </p>
            <p className="mt-2 text-sm leading-6">
              Інша сторона погодилася з вимогою, тому рішення адміністратора не
              потрібне.
            </p>
          </section>
        )}
        {canAppeal && (
          <section className="rounded-[var(--radius-card)] border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-heading text-lg font-bold text-amber-950">
              Не погоджуєтеся з рішенням?
            </h2>
            <p className="mt-1 text-sm leading-6 text-amber-900">
              Подайте апеляцію з поясненням. Спір знову надійде адміністратору.
            </p>
            <form onSubmit={appeal} className="mt-4">
              <label className="block text-sm font-semibold text-amber-950">
                Причина апеляції
                <textarea
                  value={appealMessage}
                  onChange={(event) => setAppealMessage(event.target.value)}
                  minLength={1}
                  maxLength={5000}
                  required
                  placeholder="Опишіть, з якою частиною рішення ви не погоджуєтеся…"
                  className="mt-2 min-h-24 w-full rounded-[var(--radius-card)] border border-amber-200 bg-bg p-3 font-normal text-text outline-none focus:border-accent"
                />
              </label>
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isAppealing || !appealMessage.trim()}
                  className="min-h-[42px] rounded-[var(--radius-pill)] bg-amber-700 px-4 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-60"
                >
                  {isAppealing ? "Надсилаємо…" : "Подати апеляцію"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="rounded-[var(--radius-card)] border border-border bg-bg p-5">
          <h2 className="font-heading text-lg font-bold">Звернення</h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-text-subtle">Ініціатор</dt>
              <dd className="mt-1 font-medium">
                {participantName(dispute.Initiator)}
              </dd>
            </div>
            <div>
              <dt className="text-text-subtle">Інша сторона</dt>
              <dd className="mt-1 font-medium">
                {participantName(dispute.Respondent)}
              </dd>
            </div>
            <div>
              <dt className="text-text-subtle">Сума спору</dt>
              <dd className="mt-1 font-medium">
                {money(dispute.disputedAmount)}
              </dd>
            </div>
            <div>
              <dt className="text-text-subtle">Створено</dt>
              <dd className="mt-1 font-medium">
                {formatDate(dispute.created_at)}
              </dd>
            </div>
          </dl>
          <h3 className="mt-5 text-sm font-semibold">Опис</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-text-muted">
            {dispute.description}
          </p>
        </section>

        {canRespond && (
          <section className="rounded-[var(--radius-card)] border border-accent/30 bg-accent/5 p-4">
            <p className="text-sm leading-6 text-text-muted">
              Ви є іншою стороною цього спору. Якщо погоджуєтеся з вимогою —
              спір закриється без рішення адміністратора. Якщо ні — передайте
              його на розгляд адміністратору.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => void respond("escalate")}
                disabled={responseAction !== null}
                className="min-h-[42px] rounded-[var(--radius-pill)] border border-danger/30 px-4 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-60"
              >
                {responseAction === "escalate"
                  ? "Передаємо…"
                  : "Не погоджуюся — передати адміну"}
              </button>
              <button
                type="button"
                onClick={() => void respond("settle")}
                disabled={responseAction !== null}
                className="min-h-[42px] rounded-[var(--radius-pill)] bg-accent px-4 text-sm font-medium text-white disabled:opacity-60"
              >
                {responseAction === "settle"
                  ? "Закриваємо…"
                  : "Погодитися з вимогою"}
              </button>
            </div>
          </section>
        )}

        <section className="rounded-[var(--radius-card)] border border-border bg-bg p-5">
          <h2 className="font-heading text-lg font-bold">Обговорення</h2>
          <div className="mt-4 space-y-3">
            {dispute.Messages?.length ? (
              dispute.Messages.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[var(--radius-card)] bg-bg-muted p-3"
                >
                  <p className="whitespace-pre-wrap text-sm leading-6 text-ink">
                    {item.message}
                  </p>
                  <p className="mt-1.5 text-xs text-text-subtle">
                    {item.Author ? participantName(item.Author) : "Учасник"} ·{" "}
                    {formatDate(item.created_at)}
                  </p>
                </article>
              ))
            ) : (
              <p className="text-sm text-text-muted">Пояснень поки немає.</p>
            )}
          </div>
          {isClosed ? (
            <p className="mt-5 rounded-[var(--radius-card)] bg-bg-muted p-3 text-sm text-text-muted">
              Цей спір уже завершено, тому додавати пояснення неможливо.
            </p>
          ) : (
            <form onSubmit={submitMessage} className="mt-5">
              <label className="block text-sm font-semibold">
                Ваше пояснення
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  minLength={1}
                  maxLength={5000}
                  required
                  placeholder="Опишіть свою позицію та важливі обставини…"
                  className="mt-2 min-h-28 w-full rounded-[var(--radius-card)] border border-border bg-bg p-3 font-normal outline-none focus:border-accent"
                />
              </label>
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="min-h-[44px] rounded-[var(--radius-pill)] bg-accent px-5 text-sm font-medium text-white disabled:opacity-60"
                >
                  {isSubmitting ? "Надсилаємо…" : "Надіслати пояснення"}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </section>
  );
}

import { useState } from "react";
import toast from "react-hot-toast";
import { Modal } from "../ui/Modal";
import {
  createDispute,
  type Dispute,
} from "../../api/disputes";

const reasons: Array<{ value: Dispute["reason"]; label: string }> = [
  { value: "payment", label: "Неповна або відсутня виплата" },
  { value: "no_show", label: "Неявка на зміну" },
  { value: "late_cancellation", label: "Скасування в день зміни" },
  { value: "work_quality", label: "Якість виконаної роботи" },
  { value: "other", label: "Інше" },
];

export function CreateDisputeModal({
  isOpen,
  shiftId,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  shiftId: number;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const [reason, setReason] = useState<Dispute["reason"]>("payment");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const close = () => {
    if (!isSubmitting) {
      setDescription("");
      setAmount("");
      onClose();
    }
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (description.trim().length < 10) return;
    setIsSubmitting(true);
    try {
      const dispute = await createDispute({
        shiftId,
        reason,
        description: description.trim(),
        ...(amount ? { disputedAmount: Number(amount) } : {}),
      });
      toast.success("Спір передано на розгляд адміністратора.");
      close();
      onCreated?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Не вдалося відкрити спір.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={close} title="Відкрити спір">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm leading-6 text-text-muted">
          Опишіть ситуацію. Інша сторона зможе надати відповідь.
        </p>
        <label className="block text-sm font-medium">
          Причина
          <select
            value={reason}
            onChange={(event) =>
              setReason(event.target.value as Dispute["reason"])
            }
            className="mt-1.5 min-h-[44px] w-full rounded-[var(--radius-card)] border border-border bg-bg px-3 font-normal outline-none focus:border-accent"
          >
            {reasons.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Опис
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            minLength={10}
            maxLength={5000}
            required
            placeholder="Що сталося? Вкажіть важливі обставини…"
            className="mt-1.5 min-h-28 w-full rounded-[var(--radius-card)] border border-border bg-bg p-3 font-normal outline-none focus:border-accent"
          />
        </label>
        <label className="block text-sm font-medium">
          Сума спору, ₴{" "}
          <span className="font-normal text-text-subtle">(необов’язково)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="mt-1.5 min-h-[44px] w-full rounded-[var(--radius-card)] border border-border bg-bg px-3 font-normal outline-none focus:border-accent"
          />
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={close}
            disabled={isSubmitting}
            className="min-h-[44px] rounded-[var(--radius-pill)] border border-border px-5 text-sm font-medium"
          >
            Скасувати
          </button>
          <button
            type="submit"
            disabled={isSubmitting || description.trim().length < 10}
            className="min-h-[44px] rounded-[var(--radius-pill)] bg-accent px-5 text-sm font-medium text-white disabled:opacity-50"
          >
            {isSubmitting ? "Надсилаємо…" : "Відкрити спір"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

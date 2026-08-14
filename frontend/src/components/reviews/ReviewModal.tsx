import { useEffect, useState } from "react";
import { Star } from "lucide-react";

import { Modal } from "../ui/Modal";

interface ReviewModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  isSubmitting: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: { rating: number; comment?: string }) => Promise<void>;
}

/** Спільна модалка оцінки після завершеної співпраці. */
export function ReviewModal({
  isOpen,
  title,
  description,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}: ReviewModalProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (isOpen) {
      setRating(null);
      setComment("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!rating) return;
    await onSubmit({ rating, comment: comment.trim() || undefined });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-sm leading-6 text-text-muted">{description}</p>
      <div className="mt-5 flex items-center gap-2" aria-label="Оцінка">
        {[1, 2, 3, 4, 5].map((value) => (
          <button key={value} type="button" onClick={() => setRating(value)} className="rounded-full p-1 transition-transform hover:scale-110" aria-label={`${value} з 5`}>
            <Star className={`h-7 w-7 ${rating && value <= rating ? "fill-warning text-warning" : "text-border"}`} />
          </button>
        ))}
      </div>
      <label className="mt-5 block text-sm font-medium">
        Коментар <span className="font-normal text-text-subtle">(необов’язково)</span>
        <textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={200} className="mt-1 min-h-24 w-full rounded-[var(--radius-card)] border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent" placeholder="Поділіться досвідом співпраці" />
      </label>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} disabled={isSubmitting} className="min-h-[44px] rounded-[var(--radius-pill)] border border-border px-5 text-sm font-semibold text-text transition-colors hover:border-accent disabled:opacity-60">Пропустити</button>
        <button type="button" onClick={handleSubmit} disabled={!rating || isSubmitting} className="min-h-[44px] rounded-[var(--radius-pill)] bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Зберігаємо…" : "Залишити відгук"}</button>
      </div>
    </Modal>
  );
}

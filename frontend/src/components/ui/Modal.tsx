import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />

      <div className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-[var(--radius-card)] bg-bg p-5 shadow-2xl sm:max-w-md sm:rounded-[var(--radius-card)] sm:p-7">
        <div className="flex items-center justify-between">
          <h2
            id="auth-modal-title"
            className="font-heading text-xl font-bold tracking-tight"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрити"
            className="-mr-2 flex h-11 w-11 items-center justify-center text-text-muted hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
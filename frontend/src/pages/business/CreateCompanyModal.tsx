import { useState, type FormEvent } from "react";
import { X } from "lucide-react";

export interface CreateCompanyPayload {
  name: string;
  edrpou: string;
  legalAddress: string;
}

interface CreateCompanyModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateCompanyPayload) => void;
}

const EDRPOU_REGEX = /^\d{8}$|^\d{10}$/; // 8 знаків — юрособа, 10 — ФОП. Уточнити з бекенд-командою.

export function CreateCompanyModal({ isOpen, isSubmitting, onClose, onSubmit }: CreateCompanyModalProps) {
  const [name, setName] = useState("");
  const [edrpou, setEdrpou] = useState("");
  const [legalAddress, setLegalAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !legalAddress.trim()) {
      setError("Заповніть, будь ласка, усі поля.");
      return;
    }
    if (!EDRPOU_REGEX.test(edrpou.trim())) {
      setError("ЄДРПОУ має містити 8 або 10 цифр.");
      return;
    }

    setError(null);
    onSubmit({ name: name.trim(), edrpou: edrpou.trim(), legalAddress: legalAddress.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="w-full max-w-md rounded-[var(--radius-card)] bg-bg p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Дані компанії</h2>
          <button onClick={onClose} className="text-text-subtle hover:text-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-muted">Назва компанії</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="Напр. ТОВ «Ромашка»"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted">ЄДРПОУ</label>
            <input
              value={edrpou}
              onChange={(e) => setEdrpou(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              maxLength={10}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="12345678"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted">Юридична адреса</label>
            <input
              value={legalAddress}
              onChange={(e) => setLegalAddress(e.target.value)}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="м. Київ, вул. ..."
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-[var(--radius-pill)] bg-accent py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {isSubmitting ? "Збереження..." : "Зберегти"}
          </button>
        </form>
      </div>
    </div>
  );
}
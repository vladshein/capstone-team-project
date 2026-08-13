import { useState, type FormEvent } from "react";

export interface CompanyFormValues {
  name: string;
  edrpou: string;
  legalAddress: string;
}

interface CompanyFormProps {
  initialValues?: CompanyFormValues;
  isSubmitting: boolean;
  serverError?: string | null;
  submitLabel?: string;
  onSubmit: (payload: CompanyFormValues) => void;
}

const EDRPOU_REGEX = /^\d{8}$|^\d{10}$/;

export function CompanyForm({
  initialValues,
  isSubmitting,
  serverError,
  submitLabel = "Зберегти",
  onSubmit,
}: CompanyFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [edrpou, setEdrpou] = useState(initialValues?.edrpou ?? "");
  const [legalAddress, setLegalAddress] = useState(initialValues?.legalAddress ?? "");
  const [error, setError] = useState<string | null>(null);

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
    <form onSubmit={handleSubmit} className="space-y-4">
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
        {/* inline server-помилка (напр. дублікат ЄДРПОУ) прив'язана саме до поля, а не глобальна */}
        {!error && serverError && <p className="mt-1 text-sm text-danger">{serverError}</p>}
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
        {isSubmitting ? "Збереження..." : submitLabel}
      </button>
    </form>
  );
}
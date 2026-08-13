import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "../../components/ui/Modal";

export interface CreateCompanyPayload {
  name: string;
  edrpou: string;
  legalAddress: string;
}

interface CreateCompanyModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  mode?: "create" | "edit";
  initialValues?: CreateCompanyPayload;
  serverError?: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateCompanyPayload) => void;
}

const EDRPOU_REGEX = /^\d{8}$/;

export function CreateCompanyModal({
  isOpen,
  isSubmitting,
  mode = "create",
  initialValues,
  serverError,
  onClose,
  onSubmit,
}: CreateCompanyModalProps) {
  const [name, setName] = useState("");
  const [edrpou, setEdrpou] = useState("");
  const [legalAddress, setLegalAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Підставляємо дані компанії щоразу, коли модалка відкривається
  // (як і в UpdateWorkerProfileModal) — інакше useState ініціалізується
  // лише раз і не підхопить дані при повторному відкритті в edit-режимі.
  useEffect(() => {
    if (!isOpen) return;
    setName(initialValues?.name ?? "");
    setEdrpou(initialValues?.edrpou ?? "");
    setLegalAddress(initialValues?.legalAddress ?? "");
    setError(null);
  }, [isOpen, initialValues]);

  if (!isOpen) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (name.trim().length < 3) {
      setError("Назва компанії має містити щонайменше 3 символи.");
      return;
    }
    if (!EDRPOU_REGEX.test(edrpou.trim())) {
      setError("ЄДРПОУ повинен складатися рівно з 8 цифр.");
      return;
    }

    setError(null);
    onSubmit({
      name: name.trim(),
      edrpou: edrpou.trim(),
      legalAddress: legalAddress.trim(),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "edit" ? "Редагування компанії" : "Дані компанії"}
    >
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
          {!error && serverError && <p className="text-sm text-danger">{serverError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-[var(--radius-pill)] bg-accent py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {isSubmitting ? "Збереження..." : mode === "edit" ? "Зберегти зміни" : "Створити компанію"}
          </button>
      </form>
    </Modal>
  );
}

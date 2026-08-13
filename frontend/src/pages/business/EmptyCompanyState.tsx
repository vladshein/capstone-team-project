import { Building2, ArrowRight } from "lucide-react";

interface EmptyBusinessStateProps {
  onCreateCompany: () => void;
}

export function EmptyBusinessState({ onCreateCompany }: EmptyBusinessStateProps) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-[var(--space-section)] text-center sm:px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-card)] bg-bg-muted text-accent">
        <Building2 className="h-8 w-8" />
      </div>

      <h1 className="mt-6 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
        Профіль компанії ще не заповнено
      </h1>
      <p className="mt-2 max-w-md text-sm text-text-muted">
        Щоб публікувати зміни та бачити виконавців, спочатку додайте базові дані
        компанії — назву, ЄДРПОУ та юридичну адресу.
      </p>

      <button
        onClick={onCreateCompany}
        className="mt-8 flex items-center gap-2 rounded-[var(--radius-pill)] bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        Заповнити профіль компанії
        <ArrowRight className="h-4 w-4" />
      </button>

      <p className="mt-4 text-xs text-text-subtle">
        Це займе менше хвилини — дані можна буде змінити пізніше в налаштуваннях.
      </p>
    </div>
  );
}
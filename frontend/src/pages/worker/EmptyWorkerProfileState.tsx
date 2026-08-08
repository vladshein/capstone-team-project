import { UserRound } from "lucide-react";

interface EmptyWorkerProfileStateProps {
  onCreateProfile: () => void;
}

export function EmptyWorkerProfileState({ onCreateProfile }: EmptyWorkerProfileStateProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-[var(--space-section)] text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning/10 text-warning">
        <UserRound className="h-7 w-7" />
      </div>
      <h1 className="mt-4 font-heading text-xl font-bold">Профіль ще не заповнено</h1>
      <p className="mt-2 text-sm text-text-subtle">
        Щоб відгукуватись на зміни, спершу вкажіть основні дані — ім'я, дату народження та
        контакти.
      </p>
      <button
        type="button"
        onClick={onCreateProfile}
        className="mt-6 rounded-[var(--radius-pill)] bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
      >
        Заповнити профіль
      </button>
    </div>
  );
}
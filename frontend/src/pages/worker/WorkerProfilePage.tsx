import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { selectUserInfo } from "../../redux/auth/selectors";
import { fetchMyProfile } from "../../redux/profile/actions";
import {
  selectWorkerProfile,
  selectWorkerProfileError,
  selectWorkerProfileLoading,
} from "../../redux/profile/selectors";
import {
  CreateWorkerProfileModal,
  type CreateWorkerProfilePayload,
} from "./CreateWorkerProfileModal";
import { Loader } from "../../components/ui/Loader";

function ProfileField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className={`mt-0.5 text-sm ${value ? "text-ink" : "text-text-subtle italic"}`}>
        {value || "не вказано"}
      </p>
    </div>
  );
}

export function WorkerProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUserInfo);
  const profile = useAppSelector(selectWorkerProfile);
  const isLoading = useAppSelector(selectWorkerProfileLoading);
  const error = useAppSelector(selectWorkerProfileError);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void dispatch(fetchMyProfile());
  }, [dispatch]);

  const handleCreateWorkerProfile = async (payload: CreateWorkerProfilePayload) => {
    setIsSubmitting(true);
    try {
      // TODO: ендпоінту немає в поточному ТЗ — уточнити з бекенд-командою.
      console.log("Створення профілю виконавця:", payload);
      await dispatch(fetchMyProfile());
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !profile) {
    return <Loader label="Завантажуємо профіль…" size="lg" fullScreen />;
  }

  if (error) {
    return <p className="p-8 text-center text-sm text-danger">{error}</p>;
  }

  if (!user || !profile) {
    return null;
  }

  const workerData = profile.WorkerProfile;
  const hasProfile = Boolean(workerData);

  return (
    <div className="mx-auto max-w-3xl px-4 py-[var(--space-section)] sm:px-6 md:px-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Профіль виконавця
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {hasProfile ? "Ваші особисті дані" : "Дані ще не заповнено"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-[var(--radius-pill)] bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        >
          <UserRound className="h-4 w-4" />
          {hasProfile ? "Редагувати профіль" : "Створити профіль"}
        </button>
      </div>

      <div className="rounded-[var(--radius-card)] border border-border bg-bg p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileField label="Ім'я" value={workerData?.firstName} />
          <ProfileField label="Прізвище" value={workerData?.lastName} />
          <ProfileField label="Телефон" value={workerData?.phone} />
          <ProfileField label="Місто" value={workerData?.city} />
        </div>
      </div>

      <CreateWorkerProfileModal
        isOpen={isModalOpen}
        isSubmitting={isSubmitting}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateWorkerProfile}
      />
    </div>
  );
}

export default WorkerProfilePage;

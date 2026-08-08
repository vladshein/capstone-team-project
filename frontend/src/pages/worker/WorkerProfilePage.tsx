import { useEffect, useState } from "react";
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
      // TODO: як і для компанії — ендпоінту немає в поточному ТЗ, уточнити з бекенд-командою.
      console.log("Створення профілю виконавця:", payload);
      await dispatch(fetchMyProfile());
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="flex items-center justify-center py-[var(--space-section)] text-sm text-text-subtle">
        Завантаження...
      </div>
    );
  }

  if (error) {
    return <p className="p-8 text-center text-sm text-danger">{error}</p>;
  }

  if (!user || !profile) {
    return null;
  }

  const workerData = profile.WorkerProfile;

  if (!workerData) {
    return (
      <>
        <div className="mx-auto max-w-md px-4 py-[var(--space-section)] text-center">
          <p className="text-sm text-text-subtle">Профіль ще не заповнено.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 rounded-[var(--radius-pill)] bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Заповнити профіль
          </button>
        </div>
        <CreateWorkerProfileModal
          isOpen={isModalOpen}
          isSubmitting={isSubmitting}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateWorkerProfile}
        />
      </>
    );
  }

  // TODO: повноцінний перегляд/редагування даних (аватар, верифікація) — за UserInfo з Frontend_TZ.
  return (
    <div className="mx-auto max-w-3xl px-4 py-[var(--space-section)] sm:px-6 md:px-8">
      <h1 className="font-heading text-2xl font-bold">Профіль виконавця</h1>
      <div className="mt-6 rounded-[var(--radius-card)] border border-border bg-bg p-6 shadow-sm">
        <p className="font-heading font-semibold">
          {workerData.firstName} {workerData.lastName}
        </p>
      </div>
    </div>
  );
}

export default WorkerProfilePage;
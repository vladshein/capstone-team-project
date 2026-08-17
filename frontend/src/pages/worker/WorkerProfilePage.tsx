import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { selectUserInfo } from "../../redux/auth/selectors";
import { fetchMyProfile } from "../../redux/auth/actions";
import {
  fetchMyWorkerProfile,
  createWorkerProfile,
  updateWorkerProfile,
} from "../../redux/worker-profile/actions";
import {
  selectWorkerProfile,
  selectWorkerProfileError,
  selectWorkerProfileStatus,
  selectHasWorkerProfile,
} from "../../redux/worker-profile/selectors";
import {
  CreateWorkerProfileModal,
  type CreateWorkerProfilePayload,
} from "./CreateWorkerProfileModal";
import {
  UpdateWorkerProfileModal,
  type UpdateWorkerProfilePayload,
} from "./UpdateWorkerProfileModal";
import { Loader } from "../../components/ui/Loader";
import { ProfileReviewsSection } from "../../components/reviews/ProfileReviewsSection";

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
  const status = useAppSelector(selectWorkerProfileStatus);
  const error = useAppSelector(selectWorkerProfileError);
  const hasProfile = useAppSelector(selectHasWorkerProfile);

  // "loading" тільки поки ще немає жодних даних — щоб при повторних
  // fetch/update не перекривати сторінку повноекранним лоадером
  const isInitialLoading = status === "loading" && profile === undefined;
  const isSubmitting = status === "loading";

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    void dispatch(fetchMyProfile());
    void dispatch(fetchMyWorkerProfile());
  }, [dispatch]);

  const handleSubmitWorkerProfile = async (payload: CreateWorkerProfilePayload) => {
    const action = hasProfile ? updateWorkerProfile(payload) : createWorkerProfile(payload);
    const result = await dispatch(action);
    if (createWorkerProfile.fulfilled.match(result) || updateWorkerProfile.fulfilled.match(result)) {
      setIsModalOpen(false);
    }
  };

  if (isInitialLoading) {
    return <Loader label="Завантажуємо профіль…" size="lg" fullScreen />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-[var(--space-section)] sm:px-6 md:px-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {profile?.avatarUrl && (
            <img
              src={profile.avatarUrl}
              alt=""
              className="h-14 w-14 rounded-full object-cover"
            />
          )}
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              Профіль виконавця
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              {hasProfile ? "Ваші особисті дані" : "Дані ще не заповнено"}
            </p>
          </div>
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
          <ProfileField label="Ім'я" value={profile?.firstName} />
          <ProfileField label="Прізвище" value={profile?.lastName} />
          <ProfileField label="Телефон" value={user?.phone} />
          <ProfileField label="ІПН" value={profile?.taxNumber} />
          <ProfileField
            label="Рейтинг"
            value={Number(profile?.rating) > 0 ? `${Number(profile?.rating).toFixed(2)} / 5` : "Ще немає відгуків"}
          />
        </div>
      </div>

      {hasProfile && <ProfileReviewsSection revieweeId={user.id} subject="worker" />}

      {hasProfile ? (
        <UpdateWorkerProfileModal
          isOpen={isModalOpen}
          isSubmitting={isSubmitting}
          phone={user?.phone ?? ""}
          profile={profile ?? null}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitWorkerProfile}
          serverError={error?.message}
        />
      ) : (
        <CreateWorkerProfileModal
          isOpen={isModalOpen}
          isSubmitting={isSubmitting}
          phone={user?.phone ?? ""}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitWorkerProfile}
          serverError={error?.message}
        />
      )}
    </div>
  );
}

export default WorkerProfilePage;

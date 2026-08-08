import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { selectUserInfo } from "../../redux/auth/selectors";
import { fetchMyProfile } from "../../redux/profile/actions";
import {
  selectBusinessProfile,
  selectBusinessProfileError,
  selectBusinessProfileLoading,
} from "../../redux/profile/selectors";
import { CreateCompanyModal, type CreateCompanyPayload } from "./CreateCompanyModal";

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

export function BusinessProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUserInfo);
  const profile = useAppSelector(selectBusinessProfile);
  const isLoading = useAppSelector(selectBusinessProfileLoading);
  const error = useAppSelector(selectBusinessProfileError);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void dispatch(fetchMyProfile());
  }, [dispatch]);

  const handleCreateCompany = async (payload: CreateCompanyPayload) => {
    setIsSubmitting(true);
    try {
      // TODO: див. коментар в старій версії BusinessDashboardPage — уточнити реальний ендпоінт створення компанії.
      console.log("Створення компанії:", payload);
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

  const company = profile.companies[0];
  const hasCompany = Boolean(company);

  return (
    <div className="mx-auto max-w-3xl px-4 py-[var(--space-section)] sm:px-6 md:px-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Профіль компанії
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {hasCompany ? "Дані вашої компанії" : "Дані ще не заповнено"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-[var(--radius-pill)] bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        >
          <Building2 className="h-4 w-4" />
          {hasCompany ? "Редагувати компанію" : "Створити компанію"}
        </button>
      </div>

      <div className="rounded-[var(--radius-card)] border border-border bg-bg p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileField label="Назва компанії" value={company?.name} />
          <ProfileField label="ЄДРПОУ" value={company?.edrpou} />
        </div>
        <div className="mt-4">
          <ProfileField label="Юридична адреса" value={company?.legalAddress} />
        </div>
      </div>

      <CreateCompanyModal
        isOpen={isModalOpen}
        isSubmitting={isSubmitting}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateCompany}
      />
    </div>
  );
}

export default BusinessProfilePage;
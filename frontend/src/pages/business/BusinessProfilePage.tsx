import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { selectUserInfo } from "../../redux/auth/selectors";
import { fetchMyProfile } from "../../redux/profile/actions";
import {
  selectBusinessProfile,
  selectBusinessProfileError,
  selectBusinessProfileLoading,
} from "../../redux/profile/selectors";
import { EmptyBusinessState } from "./EmptyBusinessState";
import { CreateCompanyModal, type CreateCompanyPayload } from "./CreateCompanyModal";

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
      // TODO: див. коментар з BusinessDashboardPage — уточнити реальний ендпоінт створення компанії.
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

  if (!company) {
    return (
      <>
        <EmptyBusinessState onCreateCompany={() => setIsModalOpen(true)} />
        <CreateCompanyModal
          isOpen={isModalOpen}
          isSubmitting={isSubmitting}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateCompany}
        />
      </>
    );
  }

  // TODO: тут згодом — редагування наявних даних компанії (name/edrpou/legalAddress),
  // окремою формою або тим же CreateCompanyModal у режимі "edit".
  return (
    <div className="mx-auto max-w-3xl px-4 py-[var(--space-section)] sm:px-6 md:px-8">
      <h1 className="font-heading text-2xl font-bold">Профіль компанії</h1>
      <div className="mt-6 rounded-[var(--radius-card)] border border-border bg-bg p-6 shadow-sm">
        <p className="font-heading font-semibold">{company.name}</p>
        <p className="mt-1 text-sm text-text-subtle">ЄДРПОУ: {company.edrpou}</p>
        <p className="mt-1 text-sm text-text-muted">{company.legalAddress}</p>
      </div>
    </div>
  );
}

export default BusinessProfilePage;
import { useState } from "react";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { selectUserInfo } from "../../redux/auth/selectors";
import { fetchMyProfile } from "../../redux/profile/actions";
import {
  selectBusinessProfile,
  selectBusinessProfileError,
  selectBusinessProfileLoading,
} from "../../redux/profile/selectors";
// import { Loader } from "../../components/ui/Loader"; // TODO: підключити, коли буде відомий реальний API компонента
import { BusinessDashboard } from "./BusinessDashboard";
import { EmptyBusinessState } from "./EmptyBusinessState";
import { CreateCompanyModal, type CreateCompanyPayload } from "./CreateCompanyModal";

export function BusinessDashboardPage() {
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
      // TODO: у ТЗ немає окремого ендпоінту створення компанії — уточнити з бекенд-командою,
      // чи це PATCH /users/current, чи новий POST /companies. Заглушка нижче:
      // await dispatch(createCompanyProfile(payload)).unwrap();
      console.log("Створення компанії:", payload);
      await dispatch(fetchMyProfile());
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !profile) {
    return (
      // <Loader />
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

  if (!hasCompany) {
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

  return (
    <BusinessDashboard
      user={user}
      companyProfile={{
        name: company.name ?? "",
        edrpou: company.edrpou ?? "",
        legalAddress: company.legalAddress ?? "",
      }}
    />
  );
}

export default BusinessDashboardPage;
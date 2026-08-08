import { useEffect } from "react";
import { Navigate } from "react-router-dom"; // TODO: підтвердити, що роутинг саме react-router-dom
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { selectUserInfo } from "../../redux/auth/selectors";
import { fetchMyProfile } from "../../redux/profile/actions";
import {
  selectBusinessProfile,
  selectBusinessProfileError,
  selectBusinessProfileLoading,
} from "../../redux/profile/selectors";
import { BusinessDashboard } from "./BusinessDashboard";

export function BusinessDashboardPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUserInfo);
  const profile = useAppSelector(selectBusinessProfile);
  const isLoading = useAppSelector(selectBusinessProfileLoading);
  const error = useAppSelector(selectBusinessProfileError);

  useEffect(() => {
    void dispatch(fetchMyProfile());
  }, [dispatch]);

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

  return (
    <BusinessDashboard
      user={user}
      companyProfile={{
        name: company?.name ?? "",
        edrpou: company?.edrpou ?? "",
        legalAddress: company?.legalAddress ?? "",
      }}
    />
  );
}

export default BusinessDashboardPage;
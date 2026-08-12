// import { useEffect } from "react";
// import { Navigate } from "react-router-dom"; // TODO: підтвердити, що роутинг саме react-router-dom
// import { useAppDispatch, useAppSelector } from "../../redux/hooks";
// import { selectUserInfo } from "../../redux/auth/selectors";
// import { fetchMyProfile } from "../../redux/profile/actions";
// import {
//   selectBusinessProfile,
//   selectBusinessProfileError,
//   selectBusinessProfileLoading,
// } from "../../redux/profile/selectors";
// import { BusinessDashboard } from "./BusinessDashboard";
// import { Loader } from "../../components/ui/Loader";

// export function BusinessDashboardPage() {
//   const dispatch = useAppDispatch();
//   const user = useAppSelector(selectUserInfo);
//   const profile = useAppSelector(selectBusinessProfile);
//   const isLoading = useAppSelector(selectBusinessProfileLoading);
//   const error = useAppSelector(selectBusinessProfileError);

//   useEffect(() => {
//     void dispatch(fetchMyProfile());
//   }, [dispatch]);

//   if (isLoading && !profile) {
//     return <Loader label="Завантажуємо кабінет…" size="lg" fullScreen />;
//   }

//   if (error) {
//     return <p className="p-8 text-center text-sm text-danger">{error}</p>;
//   }

//   if (!user || !profile) {
//     return null;
//   }

//   const company = profile.companies[0];

//   return (
//     <BusinessDashboard
//       user={user}
//       companyProfile={{
//         name: company?.name ?? "",
//         edrpou: company?.edrpou ?? "",
//         legalAddress: company?.legalAddress ?? "",
//       }}
//     />
//   );
// }

// export default BusinessDashboardPage;



import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { selectCompanies, selectCompaniesStatus } from "../../redux/companies-profile/selectors";
import { fetchMyCompanies } from "../../redux/companies-profile/actions";
import { BusinessDashboard } from "./BusinessDashboard";
import { Loader } from "../../components/ui/Loader";
import { Navigate } from "react-router-dom";

export function BusinessDashboardPage() {
  const dispatch = useAppDispatch();
  const companies = useAppSelector(selectCompanies);
  const status = useAppSelector(selectCompaniesStatus);

  useEffect(() => {
    if (status === "idle") {
      void dispatch(fetchMyCompanies());
    }
  }, [status, dispatch]);

  if (status === "loading" || status === "idle") {
    return <Loader label="Завантажуємо кабінет…" size="lg" fullScreen />;
  }

  // 0 компаній: у кабінеті немає що фільтрувати й нема звідки брати вхідні процеси —
  // відправляємо на профіль, де вже є 0-стан із кнопкою "Створити компанію".
  if (companies.length === 0) {
    return <Navigate to="/profile" replace />;
  }

  return <BusinessDashboard companies={companies} />;
}

export default BusinessDashboardPage;
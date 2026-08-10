import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { selectUserInfo } from "../../redux/auth/selectors";
import { fetchMyProfile } from "../../redux/profile/actions";
import {
  selectWorkerProfile,
  selectWorkerProfileError,
  selectWorkerProfileLoading,
} from "../../redux/profile/selectors";
// import { Loader } from "../../components/ui/Loader"; // TODO: підключити, коли буде відомий реальний API компонента
import {
  WorkerDashboard,
  type Bonus,
  type UpcomingShift,
  type VerificationStatus,
  type WorkerDashboardTab,
} from "./WorkerDashboard";

// TODO: замінити на реальні селектори/actions, коли зʼявляться відповідні
// redux-слайси для цих ендпоінтів (фінансовий блок — баланс/виплати —
// прибрано з ТЗ, тож сюди навмисно не входить):
//   GET /api/profile/verification-status
//   GET /api/shifts/my-calendar
//   GET /api/engagement/bonuses
// import { selectVerificationStatus } from "../../redux/verification/selectors";
// import { selectUpcomingShift } from "../../redux/shifts/selectors";
// import { selectActiveBonuses } from "../../redux/engagement/selectors";
// import { confirmAttendance } from "../../redux/shifts/actions";

const DEFAULT_VERIFICATION: VerificationStatus = {
  diia: "none",
  passport: "none",
  selfie: "none",
  tax: "none",
  medical: "none",
};

interface WorkerDashboardPageProps {
  activeTab: WorkerDashboardTab;
}

export function WorkerDashboardPage({ activeTab }: WorkerDashboardPageProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUserInfo);
  const profile = useAppSelector(selectWorkerProfile);
  const isLoading = useAppSelector(selectWorkerProfileLoading);
  const error = useAppSelector(selectWorkerProfileError);

  // TODO: замінити на реальні useAppSelector виклики, наведені вище,
  // щойно ці зрізи стану зʼявляться.
  const verification: VerificationStatus = DEFAULT_VERIFICATION;
  const upcomingShift: UpcomingShift | null = null;
  const bonuses: Bonus[] = [];

  useEffect(() => {
    void dispatch(fetchMyProfile());
  }, [dispatch]);

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

  const workerData = profile.WorkerProfile;

  return (
    <WorkerDashboard
      user={user}
      activeTab={activeTab}
      workerProfile={{
        firstName: workerData?.firstName ?? "",
        lastName: workerData?.lastName ?? "",
        rating: workerData?.rating ?? 0,
        taxNumber: workerData?.taxNumber ?? "",
        verification,
      }}
      upcomingShift={upcomingShift}
      bonuses={bonuses}
      onConfirmAttendance={(shiftId) => {
        // TODO: void dispatch(confirmAttendance(shiftId));
        console.info("confirm-attendance", shiftId);
      }}
    />
  );
}

export default WorkerDashboardPage;

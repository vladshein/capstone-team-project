import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { selectUserInfo } from "../../redux/auth/selectors";
import { fetchMyWorkerProfile } from "../../redux/worker-profile/actions";
import {
  selectWorkerProfile,
  selectWorkerProfileError,
  selectWorkerProfileStatus,
} from "../../redux/worker-profile/selectors";
import { Loader } from "../../components/ui/Loader";
import {
  WorkerDashboard,
  type Bonus,
  type UpcomingShift,
  type VerificationStatus,
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

export function WorkerDashboardPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUserInfo);
  const profile = useAppSelector(selectWorkerProfile);
  const status = useAppSelector(selectWorkerProfileStatus);
  const isLoading = status === "loading";
  const error = useAppSelector(selectWorkerProfileError);

  // TODO: замінити на реальні useAppSelector виклики, наведені вище,
  // щойно ці зрізи стану зʼявляться.
  const verification: VerificationStatus = DEFAULT_VERIFICATION;
  const upcomingShift: UpcomingShift | null = null;
  const bonuses: Bonus[] = [];

  useEffect(() => {
    if (status === "idle") {
      void dispatch(fetchMyWorkerProfile());
    }
  }, [dispatch, status]);

  if (isLoading && !profile) {
    return <Loader label="Завантажуємо кабінет…" size="lg" fullScreen />;
  }

  if (error) {
    return <p className="p-8 text-center text-sm text-danger">{error.message}</p>;
  }

  if (!user) {
    return null;
  }

  const workerData = profile;

  return (
    <WorkerDashboard
      user={user}
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

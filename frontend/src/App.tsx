import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { AuthModals, type AuthModalMode } from "./components/auth/AuthModals";
import type { SignInPayload } from "./components/auth/SignInModal";
import type { SignUpPayload } from "./components/auth/SignUpModal";
import Loader from "./components/ui/Loader";
import { HashScroll } from "./components/ui/HashScroll";
import { MainLayout } from "./layouts/MainLayout";
import { login, logout, refreshUser, register } from "./redux/auth/actions";
import {
  selectIsLoggedIn,
  selectIsRefreshing,
  selectUserInfo,
} from "./redux/auth/selectors";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import type { ApiError } from "./redux/auth/types";
import { getDashboardPath } from "./redux/auth/helpers";

const HomePage = lazy(() => import("./pages/HomePage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const ShiftsDetailPage = lazy(() => import("./pages/ShiftsDetailPage"));
const WorkerDashboardPage = lazy(() => import("./pages/worker/WorkerDashboardPage"));
const NearbyWorkerShiftsTab = lazy(() => import("./pages/worker/NearbyWorkerShiftsTab"));
const BookingsTab = lazy(() => import("./pages/worker/BookingsTab"));
const FavoriteShiftsTab = lazy(() => import("./pages/worker/FavoriteShiftsTab"));
const BusinessDashboardPage = lazy(() => import("./pages/business/BusinessDashboardPage"));
const WorkerProfilePage = lazy(() => import("./pages/worker/WorkerProfilePage"));
const BusinessProfilePage = lazy(() => import("./pages/business/BusinessProfilePage"));

const getApiError = (error: unknown): ApiError => {
  if (typeof error === "object" && error !== null && "message" in error) {
    return error as ApiError;
  }

  return { message: "Сталася помилка. Спробуйте ще раз." };
};

export default function App() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUserInfo);
  const isAuthenticated = useAppSelector(selectIsLoggedIn);
  const isRefreshing = useAppSelector(selectIsRefreshing);
  const isReduxLoading = useAppSelector((state) =>
    Boolean(
      state.auth.isLoading,
      // state.categories.isLoading ||
      // state.areas.isLoading ||
      // state.users.isLoading ||
      // state.shifts.isLoading,
    ),
  );
  const [authModal, setAuthModal] = useState<AuthModalMode>(null);

  useEffect(() => {
    void dispatch(refreshUser());
  }, [dispatch]);

  const handleSignIn = async (payload: SignInPayload) => {
    try {
      await dispatch(login(payload)).unwrap();
      setAuthModal(null);
    } catch (error) {
      const { status, message } = getApiError(error);
      toast.error(
        status === 401
          ? "Email або пароль неправильні"
          : `Помилка входу: ${message}`,
      );
      throw new Error(message);
    }
  };

  const handleSignUp = async (payload: SignUpPayload) => {
    try {
      await dispatch(register(payload)).unwrap();
      setAuthModal(null);
      toast.success("Реєстрація успішна!");
    } catch (error) {
      const { status, message } = getApiError(error);
      toast.error(
        status === 409
          ? message
          : `Помилка реєстрації: ${message}`,
      );
      throw new Error(message);
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      toast.success("Ви вийшли з акаунта");
    } catch (error) {
      const { message } = getApiError(error);
      toast.error(`Не вдалося вийти: ${message}`);
    }
  };

  const renderWorkerDashboard = () => {
    if (!isAuthenticated) return <Navigate to="/" replace />;
    if (getDashboardPath(user?.role) !== "/cabinet") {
      return <Navigate to={getDashboardPath(user?.role)} replace />;
    }
    return <WorkerDashboardPage />;
  };

  if (isRefreshing || isReduxLoading) {
    return <Loader fullScreen />;
  }

  return (
    <>
      <MainLayout
        // isAuthenticated={isAuthenticated}
        // userRole={user?.role}
        onOpenSignIn={() => setAuthModal("signin")}
        onOpenSignUp={() => setAuthModal("signup")}
        onLogout={handleLogout}
      >
        <Suspense fallback={<Loader fullScreen />}>
          <HashScroll />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shifts/:id" element={<ShiftsDetailPage />} />

              <Route
                path="/profile"
                element={
                  !isAuthenticated ? (
                    <Navigate to="/" replace />
                  ) : user?.role === "worker" ? (
                    <WorkerProfilePage />
                  ) : user?.role === "business_client" ? (
                    <BusinessProfilePage />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />

              <Route path="/cabinet" element={renderWorkerDashboard()}>
                <Route index element={<BookingsTab />} />
                <Route path="search" element={<NearbyWorkerShiftsTab />} />
                <Route path="bookings" element={<BookingsTab />} />
                <Route path="favorites" element={<FavoriteShiftsTab />} />
              </Route>

              <Route
                path="/dashboard"
                element={
                  !isAuthenticated ? (
                    <Navigate to="/" replace />
                  ) : getDashboardPath(user?.role) !== "/dashboard" ? (
                    <Navigate to={getDashboardPath(user?.role)} replace />
                  ) : (
                    <BusinessDashboardPage />
                  )
                }
              />

<Route path="*" element={<NotFoundPage />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </MainLayout>

      <AuthModals
        mode={authModal}
        onClose={() => setAuthModal(null)}
        onSwitchMode={setAuthModal}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
      />
      <Toaster position="top-right" reverseOrder={false} />
    </>
  );
}

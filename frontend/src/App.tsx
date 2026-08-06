import { lazy, Suspense, useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { AuthModals, type AuthModalMode } from "./components/auth/AuthModals";
import type { SignInPayload } from "./components/auth/SignInModal";
import type { SignUpPayload } from "./components/auth/SignUpModal";
import Loader from "./components/ui/Loader";
import { MainLayout } from "./layouts/MainLayout";
import { login, logout, refreshUser, register } from "./redux/auth/actions";
import {
  selectIsLoggedIn,
  selectIsRefreshing,
  selectUserInfo,
} from "./redux/auth/selectors";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import type { ApiError } from "./redux/auth/types";

const HomePage = lazy(() => import("./pages/HomePage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

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
          ? "Цей email уже використовується"
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

  if (isRefreshing || isReduxLoading) {
    return <Loader fullScreen />;
  }

  return (
    <>
      <MainLayout
        isAuthenticated={isAuthenticated}
        userRole={user?.role}
        userBalance={user?.balance ?? 0}
        onOpenSignIn={() => setAuthModal("signin")}
        onOpenSignUp={() => setAuthModal("signup")}
        onLogout={handleLogout}
      >
        <Suspense fallback={<Loader fullScreen />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
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

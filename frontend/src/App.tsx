import { useState } from "react";
import { MainLayout } from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import { AuthModals, AuthModalMode } from "./components/auth/AuthModals";
import type { SignInPayload } from "./components/auth/SignInModal";
import type { SignUpPayload } from "./components/auth/SignUpModal";
import { loginRequest, registerRequest, type AuthUser } from "./api/auth";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authModal, setAuthModal] = useState<AuthModalMode>(null);

  const isAuthenticated = user !== null;
  const userBalance = user?.balance ?? 0;

  const handleSignIn = async (payload: SignInPayload) => {
    const { user: loggedInUser, accessToken } = await loginRequest(payload);
    localStorage.setItem("accessToken", accessToken);
    setUser(loggedInUser);
    setAuthModal(null);
  };

  const handleSignUp = async (payload: SignUpPayload) => {
    const { user: newUser, accessToken } = await registerRequest(payload);
    localStorage.setItem("accessToken", accessToken);
    setUser(newUser);
    setAuthModal(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  return (
    <>
      <MainLayout
        isAuthenticated={isAuthenticated}
        userRole={user?.role}
        userBalance={userBalance}
        onOpenSignIn={() => setAuthModal("signin")}
        onOpenSignUp={() => setAuthModal("signup")}
        onLogout={handleLogout}
      >
        <HomePage />
      </MainLayout>

      <AuthModals
        mode={authModal}
        onClose={() => setAuthModal(null)}
        onSwitchMode={setAuthModal}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
      />
    </>
  );
}
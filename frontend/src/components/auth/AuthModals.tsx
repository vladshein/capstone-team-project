import { SignInModal, SignInPayload } from "./SignInModal";
import { SignUpModal, SignUpPayload } from "./SignUpModal";
import { emailRegExp,  } from "../../constants/authConstants";

export type AuthModalMode = "signin" | "signup" | null;

interface AuthModalsProps {
  mode: AuthModalMode;
  onClose: () => void;
  onSwitchMode: (mode: AuthModalMode) => void;
  onSignIn: (payload: SignInPayload) => Promise<void>;
  onSignUp: (payload: SignUpPayload) => Promise<void>;
}

/**
 * Монтується один раз (наприклад у App.tsx поруч з <MainLayout>).
 * Яка модалка відкрита визначається пропом `mode`, яким зазвичай керує
 * App через onOpenSignIn/onOpenSignUp, що передаються в <MainLayout>.
 *
 * Приклад підключення в App.tsx:
 *
 *   const [authModal, setAuthModal] = useState<AuthModalMode>(null);
 *
 *   <MainLayout
 *     isAuthenticated={isAuthenticated}
 *     userBalance={userBalance}
 *     onOpenSignIn={() => setAuthModal("signin")}
 *     onOpenSignUp={() => setAuthModal("signup")}
 *     onLogout={handleLogout}
 *   >
 *     ...
 *   </MainLayout>
 *
 *   <AuthModals
 *     mode={authModal}
 *     onClose={() => setAuthModal(null)}
 *     onSwitchMode={setAuthModal}
 *     onSignIn={handleSignIn}
 *     onSignUp={handleSignUp}
 *   />
 */
export function AuthModals({
  mode,
  onClose,
  onSwitchMode,
  onSignIn,
  onSignUp,
}: AuthModalsProps) {
  return (
    <>
      <SignInModal
        isOpen={mode === "signin"}
        onClose={onClose}
        onSwitchToSignUp={() => onSwitchMode("signup")}
        onSignIn={onSignIn}
      />
      <SignUpModal
        isOpen={mode === "signup"}
        onClose={onClose}
        onSwitchToSignIn={() => onSwitchMode("signin")}
        onSignUp={onSignUp}
      />
    </>
  );
}
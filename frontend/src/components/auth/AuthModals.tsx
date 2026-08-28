import { SignInModal, SignInPayload } from "./SignInModal";
import { SignUpModal, SignUpPayload, type UserRole } from "./SignUpModal";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

export type AuthModalMode = "signin" | "signup" | "forgot-password" | null;

interface AuthModalsProps {
  mode: AuthModalMode;
  signUpRole?: UserRole;
  onClose: () => void;
  onSwitchMode: (mode: AuthModalMode) => void;
  onSignIn: (payload: SignInPayload) => Promise<void>;
  onSignUp: (payload: SignUpPayload) => Promise<void>;
  onRequestPasswordReset: (email: string) => Promise<void>;
}

export function AuthModals({
  mode,
  signUpRole,
  onClose,
  onSwitchMode,
  onSignIn,
  onSignUp,
  onRequestPasswordReset,
}: AuthModalsProps) {
  return (
    <>
      <SignInModal
        isOpen={mode === "signin"}
        onClose={onClose}
        onSwitchToSignUp={() => onSwitchMode("signup")}
        onForgotPassword={() => onSwitchMode("forgot-password")}
        onSignIn={onSignIn}
      />
      <SignUpModal
        isOpen={mode === "signup"}
        initialRole={signUpRole}
        onClose={onClose}
        onSwitchToSignIn={() => onSwitchMode("signin")}
        onSignUp={onSignUp}
      />
      <ForgotPasswordModal
        isOpen={mode === "forgot-password"}
        onClose={onClose}
        onSwitchToSignIn={() => onSwitchMode("signin")}
        onRequestPasswordReset={onRequestPasswordReset}
      />
    </>
  );
}

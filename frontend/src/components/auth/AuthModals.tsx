import { SignInModal, SignInPayload } from "./SignInModal";
import { SignUpModal, SignUpPayload, type UserRole } from "./SignUpModal";
import { emailRegExp,  } from "../../constants/authConstants";

export type AuthModalMode = "signin" | "signup" | null;

interface AuthModalsProps {
  mode: AuthModalMode;
  signUpRole?: UserRole;
  onClose: () => void;
  onSwitchMode: (mode: AuthModalMode) => void;
  onSignIn: (payload: SignInPayload) => Promise<void>;
  onSignUp: (payload: SignUpPayload) => Promise<void>;
}

export function AuthModals({
  mode,
  signUpRole,
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
        initialRole={signUpRole}
        onClose={onClose}
        onSwitchToSignIn={() => onSwitchMode("signin")}
        onSignUp={onSignUp}
      />
    </>
  );
}

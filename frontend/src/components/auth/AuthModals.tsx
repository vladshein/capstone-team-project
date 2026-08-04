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
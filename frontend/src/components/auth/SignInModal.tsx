import { SyntheticEvent, useState } from "react";
import { Modal } from "../ui/Modal";
import { FormField } from "../ui/FormField";
import { emailRegExp } from "../../constants/authConstants";

export interface SignInPayload {
  email: string;
  password: string;
}

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignUp: () => void;
  onSignIn: (payload: SignInPayload) => Promise<void>;
}

interface FormErrors {
  email?: string;
  password?: string;
  submit?: string;
}

export function SignInModal({
  isOpen,
  onClose,
  onSwitchToSignUp,
  onSignIn,
}: SignInModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (cleanEmail: string): FormErrors => {
    const next: FormErrors = {};

    if (!cleanEmail) {
      next.email = "Вкажіть email";
    } else if (!emailRegExp.test(cleanEmail)) {
      next.email = "Введіть коректний email";
    }

    if (password.length < 6) {
      next.password = "Пароль має містити щонайменше 6 символів";
    }

    return next;
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const cleanedEmail = email.trim().toLowerCase();
    setEmail(cleanedEmail);

    const validationErrors = validate(cleanedEmail);
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await onSignIn({ email: cleanedEmail, password });
      handleClose();
    } catch (err) {
      setErrors({
        submit:
          err instanceof Error
            ? err.message
            : "Не вдалося увійти. Перевірте дані та спробуйте ще раз.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Вхід">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) {
              setErrors((prev) => ({ ...prev, email: undefined }));
            }
          }}
          onBlur={() => setEmail((prev) => prev.trim())}
          error={errors.email}
        />

        <FormField
          label="Пароль"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) {
              setErrors((prev) => ({ ...prev, password: undefined }));
            }
          }}
          error={errors.password}
        />

        <button
          type="button"
          className="-mt-2 self-end text-xs font-medium text-accent-text"
        >
          Забули пароль?
        </button>

        {errors.submit && (
          <p className="text-sm text-danger">{errors.submit}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-[44px] rounded-[var(--radius-pill)] bg-accent px-6 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {isSubmitting ? "Входимо…" : "Увійти"}
        </button>

        <p className="text-center text-sm text-text-muted">
          Немає акаунту?{" "}
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="font-medium text-accent-text"
          >
            Зареєструватися
          </button>
        </p>
      </form>
    </Modal>
  );
}
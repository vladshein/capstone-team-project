import { SyntheticEvent, useState } from "react";
import { Modal } from "../ui/Modal";
import { FormField } from "../ui/FormField";
import { emailRegExp, phoneRegExp } from "../../constants/authConstants";

export type UserRole = "worker" | "business";

export interface SignUpPayload {
  role: UserRole;
  email: string;
  phone: string;
  password: string;
}

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignIn: () => void;
  onSignUp: (payload: SignUpPayload) => Promise<void>;
}

interface FormErrors {
  role?: "worker" | "business";
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
  submit?: string;
}

export function SignUpModal({
  isOpen,
  onClose,
  onSwitchToSignIn,
  onSignUp,
}: SignUpModalProps) {
  const [role, setRole] = useState<UserRole>("worker");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!emailRegExp.test(email)) {
      next.email = "Некоректний email";
    }
    if (!phoneRegExp.test(phone.replace(/[\s()-]/g, ""))) {
      next.phone = "Некоректний номер телефону";
    }
    if (password.length < 8) {
      next.password = "Пароль має містити щонайменше 6 символів";
    }
    if (!agreedToTerms) {
      next.terms = "Потрібно погодитися з умовами використання";
    }
    return next;
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await onSignUp({ role, email, phone, password });
      handleClose();
    } catch (err) {
      setErrors({
        submit:
          err instanceof Error
            ? err.message
            : "Не вдалося зареєструватися. Спробуйте ще раз.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRole("worker");
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
    setAgreedToTerms(false);
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Реєстрація">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex rounded-[var(--radius-pill)] border border-border p-1 text-sm">
          <button
            type="button"
            onClick={() => setRole("worker")}
            className={`flex-1 rounded-[var(--radius-pill)] px-3 py-2 font-medium transition-colors ${
              role === "worker" ? "bg-ink text-white" : "text-text"
            }`}
          >
            Я виконавець
          </button>
          <button
            type="button"
            onClick={() => setRole("business")}
            className={`flex-1 rounded-[var(--radius-pill)] px-3 py-2 font-medium transition-colors ${
              role === "business" ? "bg-ink text-white" : "text-text"
            }`}
          >
            Я бізнес
          </button>
        </div>

        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <FormField
          label="Телефон"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+380 XX XXX XX XX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
        />
        <FormField
          label="Пароль"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />

        <label className="flex items-start gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-accent focus:ring-accent"
          />
          <span>
            Я погоджуюсь з{" "}
            <a href="/terms" className="font-medium text-accent-text">
              умовами використання
            </a>{" "}
            та політикою конфіденційності
          </span>
        </label>
        {errors.terms && (
          <p className="-mt-2 text-xs text-danger">{errors.terms}</p>
        )}

        {errors.submit && (
          <p className="text-sm text-danger">{errors.submit}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-[44px] rounded-[var(--radius-pill)] bg-accent px-6 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {isSubmitting ? "Реєструємо…" : "Зареєструватися"}
        </button>

        <p className="text-center text-sm text-text-muted">
          Вже маєте акаунт?{" "}
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="font-medium text-accent-text"
          >
            Увійти
          </button>
        </p>
      </form>
    </Modal>
  );
}
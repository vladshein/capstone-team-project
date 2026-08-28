import { SyntheticEvent, useState } from "react";
import { MailCheck } from "lucide-react";
import { emailRegExp } from "../../constants/authConstants";
import { FormField } from "../ui/FormField";
import { Modal } from "../ui/Modal";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignIn: () => void;
  onRequestPasswordReset: (email: string) => Promise<void>;
}

interface FormErrors {
  email?: string;
  submit?: string;
}

export function ForgotPasswordModal({
  isOpen,
  onClose,
  onSwitchToSignIn,
  onRequestPasswordReset,
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const resetForm = () => {
    setEmail("");
    setErrors({});
    setIsSubmitting(false);
    setIsSent(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSwitchToSignIn = () => {
    resetForm();
    onSwitchToSignIn();
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanedEmail = email.trim().toLowerCase();
    setEmail(cleanedEmail);

    if (!cleanedEmail) {
      setErrors({ email: "Вкажіть email" });
      return;
    }

    if (!emailRegExp.test(cleanedEmail)) {
      setErrors({ email: "Введіть коректний email" });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await onRequestPasswordReset(cleanedEmail);
      setIsSent(true);
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "Не вдалося надіслати інструкції. Спробуйте пізніше.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isSent ? "Перевірте пошту" : "Відновлення пароля"}
    >
      {isSent ? (
        <div className="space-y-5 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            <MailCheck aria-hidden="true" className="h-6 w-6" />
          </span>
          <p className="text-sm leading-6 text-text-muted">
            Якщо акаунт з адресою <strong className="font-medium text-ink">{email}</strong> існує,
            ми надіслали посилання для встановлення нового пароля.
          </p>
          <p className="text-xs leading-5 text-text-subtle">
            Посилання дійсне 15 хвилин. Перевірте також папку «Спам».
          </p>
          <button
            type="button"
            onClick={handleSwitchToSignIn}
            className="min-h-[44px] w-full cursor-pointer rounded-[var(--radius-pill)] bg-accent px-6 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Повернутися до входу
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <p className="-mt-1 text-sm leading-6 text-text-muted">
            Вкажіть email, з яким ви реєструвалися. Ми надішлемо посилання для нового пароля.
          </p>
          <FormField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (errors.email || errors.submit) {
                setErrors((previous) => ({ ...previous, email: undefined, submit: undefined }));
              }
            }}
            onBlur={() => setEmail((previous) => previous.trim())}
            error={errors.email}
          />

          {errors.submit && <p className="text-sm text-danger">{errors.submit}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-[44px] cursor-pointer rounded-[var(--radius-pill)] bg-accent px-6 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? "Надсилаємо…" : "Надіслати посилання"}
          </button>

          <p className="text-center text-sm text-text-muted">
            Згадали пароль?{" "}
            <button
              type="button"
              onClick={handleSwitchToSignIn}
              className="cursor-pointer font-medium text-accent-text transition-colors hover:text-accent-hover"
            >
              Увійти
            </button>
          </p>
        </form>
      )}
    </Modal>
  );
}

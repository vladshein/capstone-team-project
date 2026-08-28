import { SyntheticEvent, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, CircleAlert, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FormField } from "../components/ui/FormField";
import { authService } from "../services/authService";

interface ResetPasswordPageProps {
  onOpenSignIn: () => void;
  onOpenForgotPassword: () => void;
}

type ResetState = "form" | "success" | "invalid-link";

interface FormErrors {
  password?: string;
  confirmPassword?: string;
  submit?: string;
}

export default function ResetPasswordPage({
  onOpenSignIn,
  onOpenForgotPassword,
}: ResetPasswordPageProps) {
  const navigate = useNavigate();
  // Token міститься у fragment: він не передається до сервера разом із URL,
  // а API отримає його лише у POST body після відправлення форми.
  const token = useMemo(
    () => new URLSearchParams(window.location.hash.slice(1)).get("token"),
    [],
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [state, setState] = useState<ResetState>(token ? "form" : "invalid-link");
  const [message, setMessage] = useState("");

  const openAuthModal = (openModal: () => void) => {
    navigate("/");
    openModal();
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors: FormErrors = {};
    if (password.length < 8) {
      validationErrors.password = "Пароль має містити щонайменше 8 символів";
    }
    if (password !== confirmPassword) {
      validationErrors.confirmPassword = "Паролі не збігаються";
    }

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0 || !token) return;

    setIsSubmitting(true);
    try {
      const { data } = await authService.resetPassword(token, password);
      setState("success");
      setMessage(data.message ?? "Пароль успішно оновлено. Тепер увійдіть з новим паролем.");
      // Після успішного використання token більше не має залишатися в URL та історії.
      window.history.replaceState({}, "", "/reset-password");
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "Не вдалося оновити пароль. Запросіть нове посилання.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (state === "invalid-link") {
    return (
      <ResetResult
        icon={<CircleAlert aria-hidden="true" className="h-7 w-7" />}
        iconClassName="bg-danger/10 text-danger"
        title="Посилання недійсне"
        message="Посилання для відновлення пароля неповне або вже недійсне. Запросіть нове."
        actionLabel="Надіслати нове посилання"
        onAction={() => openAuthModal(onOpenForgotPassword)}
      />
    );
  }

  if (state === "success") {
    return (
      <ResetResult
        icon={<CheckCircle2 aria-hidden="true" className="h-7 w-7" />}
        iconClassName="bg-accent/10 text-accent"
        title="Пароль оновлено"
        message={message}
        actionLabel="Увійти"
        onAction={() => openAuthModal(onOpenSignIn)}
      />
    );
  }

  return (
    <section className="flex min-h-[60vh] items-center justify-center bg-bg-muted px-4 py-16 sm:px-6">
      <div className="w-full max-w-md rounded-[var(--radius-card)] border border-border bg-bg px-6 py-10 shadow-sm sm:px-10">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
          <KeyRound aria-hidden="true" className="h-7 w-7" />
        </span>
        <h1 className="mt-6 font-heading text-2xl font-bold text-ink sm:text-3xl">
          Створіть новий пароль
        </h1>
        <p className="mt-3 text-sm leading-6 text-text-muted">
          Встановіть надійний пароль для свого акаунта на платформі «Зміна».
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-7 flex flex-col gap-4">
          <FormField
            label="Новий пароль"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (errors.password || errors.submit) {
                setErrors((previous) => ({ ...previous, password: undefined, submit: undefined }));
              }
            }}
            error={errors.password}
          />
          <FormField
            label="Повторіть новий пароль"
            name="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              if (errors.confirmPassword || errors.submit) {
                setErrors((previous) => ({
                  ...previous,
                  confirmPassword: undefined,
                  submit: undefined,
                }));
              }
            }}
            error={errors.confirmPassword}
          />

          {errors.submit && <p className="text-sm text-danger">{errors.submit}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? "Оновлюємо…" : "Оновити пароль"}
            {!isSubmitting && <ArrowRight aria-hidden="true" className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </section>
  );
}

interface ResetResultProps {
  icon: React.ReactNode;
  iconClassName: string;
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}

function ResetResult({
  icon,
  iconClassName,
  title,
  message,
  actionLabel,
  onAction,
}: ResetResultProps) {
  return (
    <section className="flex min-h-[60vh] items-center justify-center bg-bg-muted px-4 py-16 sm:px-6">
      <div className="w-full max-w-xl rounded-[var(--radius-card)] border border-border bg-bg px-6 py-12 text-center shadow-sm sm:px-12">
        <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${iconClassName}`}>
          {icon}
        </span>
        <h1 className="mt-6 font-heading text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-muted sm:text-base">{message}</p>
        <button
          type="button"
          onClick={onAction}
          className="mt-8 inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          {actionLabel}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

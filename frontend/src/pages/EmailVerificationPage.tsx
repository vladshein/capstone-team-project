import { useEffect, useRef, useState } from "react";
import { CheckCircle2, CircleAlert, MailCheck } from "lucide-react";
import { Link } from "react-router-dom";
import Loader from "../components/ui/Loader";
import { authService } from "../services/authService";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { markEmailAsVerified } from "../redux/auth/slice";
import { selectUserInfo } from "../redux/auth/selectors";

type VerificationState = "loading" | "success" | "error";

export default function EmailVerificationPage() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectUserInfo);
  const [state, setState] = useState<VerificationState>("loading");
  const [message, setMessage] = useState("Перевіряємо посилання…");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    // Verification token живе лише у URL fragment. Браузер не надсилає
    // fragment на сервер, тому токен не потрапляє до access-логів або Referer.
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    if (!token) {
      setState("error");
      setMessage("Посилання для підтвердження неповне або недійсне.");
      return;
    }

    void authService
      .verifyEmail(token)
      .then(({ data }) => {
        // Лист можуть відкрити в браузері, де активний інший акаунт. Оновлюємо
        // Redux лише тоді, коли підтверджено саме поточного користувача.
        if (data.userId === currentUser?.id) {
          dispatch(markEmailAsVerified());
        }
        setState("success");
        setMessage(data.message ?? "Email успішно підтверджено.");
      })
      .catch((error: unknown) => {
        setState("error");
        setMessage(error instanceof Error ? error.message : "Не вдалося підтвердити email.");
      })
      .finally(() => {
        // Токен не повинен залишатися в URL або історії браузера після обробки.
        window.history.replaceState({}, "", "/email-verification");
      });
  }, [currentUser?.id, dispatch]);

  if (state === "loading") {
    return <Loader label={message} fullScreen size="lg" />;
  }

  const isSuccess = state === "success";
  const Icon = isSuccess ? CheckCircle2 : CircleAlert;

  return (
    <section className="flex min-h-[60vh] items-center justify-center bg-bg-muted px-4 py-16 sm:px-6">
      <div className="w-full max-w-xl rounded-[var(--radius-card)] border border-border bg-bg px-6 py-12 text-center shadow-sm sm:px-12">
        <span
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
            isSuccess ? "bg-accent/10 text-accent" : "bg-danger/10 text-danger"
          }`}
        >
          <Icon aria-hidden="true" className="h-7 w-7" />
        </span>
        <h1 className="mt-6 font-heading text-2xl font-bold text-ink sm:text-3xl">
          {isSuccess ? "Email підтверджено" : "Не вдалося підтвердити email"}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-muted sm:text-base">{message}</p>
        <Link
          to="/"
          className="mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-pill)] bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          <MailCheck aria-hidden="true" className="h-4 w-4" />
          На головну
        </Link>
      </div>
    </section>
  );
}

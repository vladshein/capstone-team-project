import { useState } from "react";
import { Mail } from "lucide-react";
import toast from "react-hot-toast";
import { authService } from "../../services/authService";
import { selectUserInfo } from "../../redux/auth/selectors";
import { useAppSelector } from "../../redux/hooks";

/**
 * Акаунт не блокується до підтвердження пошти, але користувач завжди бачить
 * спосіб повторно надіслати лист. Сервер додатково захищає дію rate limit-ом.
 */
export function EmailVerificationNotice() {
  const user = useAppSelector(selectUserInfo);
  const [isSending, setIsSending] = useState(false);
  const [wasSent, setWasSent] = useState(false);

  if (!user || user.isVerified !== false) return null;

  const handleResend = async () => {
    try {
      setIsSending(true);
      const { data } = await authService.resendEmailVerification();
      setWasSent(true);
      toast.success(data.message ?? "Лист надіслано повторно.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не вдалося надіслати лист.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <aside className="border-b border-accent/20 bg-accent/5 px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 text-sm sm:flex-row sm:items-center">
        <p className="flex items-center gap-2 text-text-muted">
          <Mail aria-hidden="true" className="h-4 w-4 shrink-0 text-accent" />
          Підтвердьте email, щоб захистити свій акаунт.
        </p>
        <button
          type="button"
          onClick={handleResend}
          disabled={isSending || wasSent}
          className="cursor-pointer font-medium text-accent-text underline decoration-accent/40 underline-offset-4 transition-colors hover:text-accent-hover disabled:cursor-not-allowed disabled:text-text-muted disabled:no-underline"
        >
          {isSending ? "Надсилаємо…" : wasSent ? "Лист надіслано" : "Надіслати лист повторно"}
        </button>
      </div>
    </aside>
  );
}

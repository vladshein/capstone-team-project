import { useEffect } from "react";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Moon,
  Navigation,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import Loader from "../components/ui/Loader";
import NotFoundPage from "./NotFoundPage";
import { applyToShift, fetchShiftById } from "../redux/shift/actions";
import { selectIsLoggedIn, selectUserInfo } from "../redux/auth/selectors";
import {
  selectIsApplyingToShift,
  selectIsLoadingShiftDetails,
  selectSelectedShift,
  selectShiftApplication,
  selectShiftApplicationError,
  selectShiftError,
} from "../redux/shift/selectors";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import type { Shift } from "../redux/shift/types";

const moneyFormatter = new Intl.NumberFormat("uk-UA", {
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("uk-UA", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const timeFormatter = new Intl.DateTimeFormat("uk-UA", {
  hour: "2-digit",
  minute: "2-digit",
});

const statusMeta = {
  open: { label: "Відкрита вакансія", className: "text-accent" },
  booked: { label: "Набір завершено", className: "text-warning" },
  in_progress: { label: "Зміна триває", className: "text-accent" },
  completed: { label: "Зміну завершено", className: "text-text-muted" },
  cancelled: { label: "Зміну скасовано", className: "text-danger" },
} as const;

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Дата уточнюється" : dateFormatter.format(date);
}

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : timeFormatter.format(date);
}

function getShiftTotal(shift: Shift) {
  const start = new Date(shift.startTime).getTime();
  const end = new Date(shift.endTime).getTime();
  const duration = Math.max((end - start) / 3_600_000, 0);
  const hourlyRate = Number(shift.hourlyRate) || 0;
  const bonusRate = Number(shift.bonusRate) || 0;

  return duration * hourlyRate + bonusRate;
}

export default function ShiftsDetailPage() {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const shift = useAppSelector(selectSelectedShift);
  const isLoading = useAppSelector(selectIsLoadingShiftDetails);
  const error = useAppSelector(selectShiftError);
  const isAuthenticated = useAppSelector(selectIsLoggedIn);
  const user = useAppSelector(selectUserInfo);
  const isApplying = useAppSelector(selectIsApplyingToShift);
  const application = useAppSelector(selectShiftApplication);
  const applicationError = useAppSelector(selectShiftApplicationError);
  const shiftId = Number(id);
  const isInvalidId = !Number.isInteger(shiftId) || shiftId <= 0;

  useEffect(() => {
    if (!isInvalidId) void dispatch(fetchShiftById(shiftId));
  }, [dispatch, isInvalidId, shiftId]);

  if (!isInvalidId && (isLoading || (!shift && !error))) {
    return <Loader fullScreen label="Завантажуємо деталі зміни…" />;
  }

  if (isInvalidId || error || !shift) {
    return (
      <NotFoundPage
        title="Зміну не знайдено"
        description={
          isInvalidId
            ? "Посилання на зміну містить некоректний ідентифікатор."
            : error ?? "Схоже, цю зміну вже закрили або видалили."
        }
      />
    );
  }

  const companyName = shift.Location?.Company?.name ?? "Компанія";
  const title = shift.JobPosition?.title ?? shift.Category?.name ?? "Зміна";
  const address = `${shift.Location?.address ?? "Адреса уточнюється"}, ${shift.Location?.city ?? ""}`.replace(/, $/, "");
  const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const total = getShiftTotal(shift);
  const hourlyRate = Number(shift.hourlyRate) || 0;
  const bonusRate = Number(shift.bonusRate) || 0;
  const hasBonus = bonusRate > 0;
  const status = statusMeta[shift.status] ?? statusMeta.cancelled;
  const canApply = shift.status === "open";
  const hasApplied = application?.shiftId === shift.id;

  const handleApply = async () => {
    if (!isAuthenticated) {
      toast.error("Увійдіть в акаунт, щоб відгукнутися на зміну.");
      return;
    }

    if (user?.role !== "worker") {
      toast.error("Відгукуватися на зміни можуть лише виконавці.");
      return;
    }

    try {
      await dispatch(applyToShift(shift.id)).unwrap();
      toast.success("Відгук на зміну надіслано.");
    } catch (requestError) {
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Не вдалося надіслати відгук.",
      );
    }
  };

  return (
    <main className="bg-bg-muted py-8 sm:py-10 lg:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <Link
          to="/"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-text-muted transition-colors hover:text-accent-text"
        >
          <ArrowLeft className="h-4 w-4" /> До всіх змін
        </Link>

        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <section className="rounded-[var(--radius-card)] border border-border bg-bg p-5 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-card)] bg-accent/10 font-heading text-xl font-bold text-accent sm:h-14 sm:w-14">
                  {companyName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-text-muted">{companyName}</p>
                  <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                    {title}
                  </h1>
                  <span className="mt-3 inline-flex rounded-[var(--radius-pill)] bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-text">
                    {shift.Category?.name ?? "Відкрита зміна"}
                  </span>
                </div>
              </div>
              <span className={`inline-flex w-fit items-center gap-1.5 text-sm ${status.className}`}>
                <BriefcaseBusiness className="h-4 w-4" /> {status.label}
              </span>
            </div>

            <div className="grid gap-3 py-6 sm:grid-cols-2">
              <div className="flex gap-3 rounded-[var(--radius-card)] bg-bg-muted p-4">
                <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div><p className="text-xs text-text-muted">Дата зміни</p><p className="mt-1 text-sm font-semibold capitalize text-ink">{formatDate(shift.startTime)}</p></div>
              </div>
              <div className="flex gap-3 rounded-[var(--radius-card)] bg-bg-muted p-4">
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div><p className="text-xs text-text-muted">Час роботи</p><p className="mt-1 text-sm font-semibold text-ink">{formatTime(shift.startTime)} — {formatTime(shift.endTime)}</p></div>
              </div>
              <div className="flex gap-3 rounded-[var(--radius-card)] bg-bg-muted p-4 sm:col-span-2">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div><p className="text-xs text-text-muted">Локація</p><p className="mt-1 text-sm font-semibold text-ink">{shift.Location?.title ?? companyName}</p><p className="mt-0.5 text-sm text-text-muted">{address}</p></div>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h2 className="font-heading text-xl font-bold text-ink">Що потрібно робити</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-text">
                {shift.description ?? "Деталі завдань уточнюйте у представника компанії після відгуку."}
              </p>
            </div>

            <div className="mt-8 border-t border-border pt-6">
              <h2 className="font-heading text-xl font-bold text-ink">Умови</h2>
              <ul className="mt-4 grid gap-3 text-sm text-text sm:grid-cols-2">
                <li className="flex items-center gap-2"><Moon className="h-4 w-4 text-text-subtle" /> Тривалість за графіком зміни</li>
                <li className="flex items-center gap-2"><WalletCards className="h-4 w-4 text-text-subtle" /> Оплата після виконання</li>
                <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-text-subtle" /> Безпечна оплата через платформу</li>
                {hasBonus && <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-text-subtle" /> Бонус {moneyFormatter.format(bonusRate)} ₴</li>}
              </ul>
            </div>

            <div className="mt-8 overflow-hidden rounded-[var(--radius-card)] border border-border bg-bg">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-medium text-ink sm:px-5">
                <MapPin className="h-4 w-4 text-accent" /> Як дістатися
              </div>
              <iframe
                title={`Мапа: ${address}`}
                src={mapEmbedUrl}
                className="h-56 w-full border-0 sm:h-72"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="flex flex-col gap-4 bg-bg-muted p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <p className="text-sm text-text-muted">{address}</p>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
                >
                  <Navigation className="h-4 w-4" /> Прокласти маршрут
                </a>
              </div>
            </div>
          </section>

          <aside className="lg:sticky lg:top-24">
            <div className="rounded-[var(--radius-card)] border border-border bg-bg p-5 shadow-sm sm:p-6">
              <p className="text-sm text-text-muted">Ви отримаєте</p>
              <p className="mt-1 font-mono text-3xl font-bold tracking-tight text-ink">~{moneyFormatter.format(total)} ₴</p>
              <p className="mt-1 text-xs text-text-subtle">{moneyFormatter.format(hourlyRate)} ₴/год {hasBonus ? `+ бонус ${moneyFormatter.format(bonusRate)} ₴` : ""}</p>
              <div className="mt-5 border-t border-border pt-5">
                <p className="flex items-center gap-2 text-sm text-text"><CalendarDays className="h-4 w-4 text-text-subtle" /> {formatDate(shift.startTime)}</p>
                <p className="mt-3 flex items-center gap-2 text-sm text-text"><Clock3 className="h-4 w-4 text-text-subtle" /> {formatTime(shift.startTime)} — {formatTime(shift.endTime)}</p>
              </div>
              {canApply && !hasApplied ? (
                <>
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={isApplying}
                    className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-[var(--radius-pill)] bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {isApplying ? "Надсилаємо відгук…" : "Відгукнутися на зміну"}
                  </button>
                  <p className="mt-3 text-center text-xs leading-5 text-text-subtle">Після відгуку компанія підтвердить вашу участь.</p>
                  {applicationError && <p className="mt-2 text-center text-xs text-danger">{applicationError}</p>}
                </>
              ) : (
                <p className="mt-6 rounded-[var(--radius-card)] bg-bg-muted px-4 py-3 text-center text-sm font-medium text-text-muted">
                  {hasApplied ? "Ваш відгук надіслано" : status.label}
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

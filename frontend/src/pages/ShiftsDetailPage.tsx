import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Heart,
  MapPin,
  Moon,
  Navigation,
  Pencil,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import Loader from "../components/ui/Loader";
import { Modal } from "../components/ui/Modal";
import NotFoundPage from "./NotFoundPage";
import { applyToShift, createNewShift, fetchShiftById } from "../redux/shift/actions";
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
import { fetchMyCompanies } from "../redux/companies-profile/actions";
import { selectCompanyById, selectCompaniesStatus } from "../redux/companies-profile/selectors";
import type { Shift } from "../redux/shift/types";
import { useFavoriteShifts } from "../hooks/useFavoriteShifts";
import {
  cancelBusinessShift,
  cancelShiftApplication,
  getMyShiftApplications,
  type BusinessShift,
  updateShift,
  type WorkerShiftApplication,
  getBusinessShiftWorkerSummary,
  type BusinessShiftWorkerSummary,
} from "../api/shifts";
import { createReview, updateReview } from "../api/reviews";
import { ReviewModal } from "../components/reviews/ReviewModal";
import { clearApplication } from "../redux/shift/slice";
import { CreateShiftModal } from "./business/CreateShiftModal";

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
  const companiesStatus = useAppSelector(selectCompaniesStatus);
  const { isFavorite, toggleFavorite } = useFavoriteShifts();
  const [activeApplication, setActiveApplication] = useState<WorkerShiftApplication | null>(null);
  const [isCheckingApplication, setIsCheckingApplication] = useState(false);
  const [isCancellingApplication, setIsCancellingApplication] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isBusinessCancelModalOpen, setIsBusinessCancelModalOpen] = useState(false);
  const [isEditingShift, setIsEditingShift] = useState(false);
  const [isSavingBusinessShift, setIsSavingBusinessShift] = useState(false);
  const [isCancellingBusinessShift, setIsCancellingBusinessShift] = useState(false);
  const [isRepeatModalOpen, setIsRepeatModalOpen] = useState(false);
  const [isRepeatingShift, setIsRepeatingShift] = useState(false);
  const [workerSummary, setWorkerSummary] = useState<BusinessShiftWorkerSummary | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const shiftId = Number(id);
  const isInvalidId = !Number.isInteger(shiftId) || shiftId <= 0;
  const favorite = shift ? isFavorite(shift.id) : false;
  const companyId = shift?.Location?.Company?.id ?? 0;
  const owningCompany = useAppSelector(selectCompanyById(companyId));

  useEffect(() => {
    if (!isInvalidId) void dispatch(fetchShiftById(shiftId));
  }, [dispatch, isInvalidId, shiftId]);

  useEffect(() => {
    if (user?.role === "business_client" && companiesStatus === "idle") {
      void dispatch(fetchMyCompanies());
    }
  }, [companiesStatus, dispatch, user?.role]);

  useEffect(() => {
    if (!shift || !isAuthenticated || user?.role !== "worker") {
      setActiveApplication(null);
      setIsCheckingApplication(false);
      return;
    }

    let isCurrent = true;
    setIsCheckingApplication(true);
    void getMyShiftApplications(1, 1, shift.id)
      .then((response) => {
        if (isCurrent) setActiveApplication(response.data[0] ?? null);
      })
      .catch(() => {
        if (isCurrent) setActiveApplication(null);
      })
      .finally(() => {
        if (isCurrent) setIsCheckingApplication(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [application?.id, isAuthenticated, shift, user?.role]);

  // Хук має виконуватися на кожному рендері. Перевірки всередині не дають
  // робити запит, доки деталі зміни ще завантажуються або це не її власник.
  useEffect(() => {
    const isOwner = user?.role === "business_client" && shift?.Location?.Company?.ownerId === user.id;
    const isFinished = shift ? new Date(shift.endTime) <= new Date() : false;
    if (!shift || !isOwner || !isFinished) {
      setWorkerSummary(null);
      return;
    }

    let cancelled = false;
    void getBusinessShiftWorkerSummary(shift.id)
      .then((summary) => { if (!cancelled) setWorkerSummary(summary); })
      .catch(() => { if (!cancelled) setWorkerSummary(null); });
    return () => { cancelled = true; };
  }, [shift?.Location?.Company?.ownerId, shift?.endTime, shift?.id, user?.id, user?.role]);

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
  const now = new Date();
  const isShiftStarted = new Date(shift.startTime) <= now;
  const isShiftFinished = new Date(shift.endTime) <= now;
  const canApply = shift.status === "open" && !isShiftStarted;
  const hasApplied = activeApplication?.shiftId === shift.id;
  const isShiftOwner = user?.role === "business_client" && shift.Location?.Company?.ownerId === user.id;
  const canManageShift = isShiftOwner && shift.status === "open" && !isShiftStarted;
  const canRepeatShift = isShiftOwner && (isShiftFinished || ["completed", "cancelled"].includes(shift.status));
  // Детальна відповідь містить поточну локацію, але не список усіх локацій
  // компанії. Для редагування/повторення достатньо передати хоча б її.
  const currentShiftLocation = {
    id: shift.Location.id,
    companyId: shift.Location.Company.id,
    title: shift.Location.title,
    city: shift.Location.city,
    address: shift.Location.address,
    latitude: shift.Location.latitude,
    longitude: shift.Location.longitude,
  };
  const detailLocations = owningCompany?.Locations?.length
    ? owningCompany.Locations
    : [currentShiftLocation];

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
      const createdApplication = await dispatch(applyToShift(shift.id)).unwrap();
      setActiveApplication({
        ...createdApplication,
        status: createdApplication.status === "approved" ? "approved" : "pending",
        Shift: {
          id: shift.id,
          startTime: shift.startTime,
          endTime: shift.endTime,
          hourlyRate: shift.hourlyRate,
          bonusRate: shift.bonusRate,
          description: shift.description,
          status: shift.status,
        },
      });
      toast.success("Відгук на зміну надіслано.");
    } catch (requestError) {
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Не вдалося надіслати відгук.",
      );
    }
  };

  const handleCancelApplication = async () => {
    if (!activeApplication) return;

    setIsCancellingApplication(true);
    try {
      await cancelShiftApplication(activeApplication.id);
      setActiveApplication(null);
      dispatch(clearApplication());
      setIsCancelModalOpen(false);
      toast.success("Відгук на зміну відкликано.");
    } catch (requestError) {
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Не вдалося відкликати відгук.",
      );
    } finally {
      setIsCancellingApplication(false);
    }
  };

  const handleEditShift = async (payload: Parameters<typeof updateShift>[1]) => {
    setIsSavingBusinessShift(true);
    try {
      await updateShift(shift.id, payload);
      setIsEditingShift(false);
      await dispatch(fetchShiftById(shift.id)).unwrap();
      toast.success("Зміну оновлено.");
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Не вдалося оновити зміну.");
    } finally {
      setIsSavingBusinessShift(false);
    }
  };

  const handleBusinessCancel = async () => {
    setIsCancellingBusinessShift(true);
    try {
      await cancelBusinessShift(shift.id);
      setIsBusinessCancelModalOpen(false);
      await dispatch(fetchShiftById(shift.id)).unwrap();
      toast.success("Зміну скасовано.");
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Не вдалося скасувати зміну.");
    } finally {
      setIsCancellingBusinessShift(false);
    }
  };

  const handleRepeatShift = async (payload: Parameters<typeof updateShift>[1]) => {
    setIsRepeatingShift(true);
    try {
      await dispatch(createNewShift(payload)).unwrap();
      setIsRepeatingShift(false);
      setIsRepeatModalOpen(false);
      toast.success("Нову зміну опубліковано.");
    } catch (requestError) {
      setIsRepeatingShift(false);
      toast.error(requestError instanceof Error ? requestError.message : "Не вдалося повторити зміну.");
      throw requestError;
    }
  };

  const handleReviewSubmit = async ({ rating, comment }: { rating: number; comment?: string }) => {
    if (!workerSummary) return;
    setIsSubmittingReview(true);
    setReviewError(null);
    try {
      if (workerSummary.review) await updateReview(workerSummary.review.id, { rating, comment });
      else await createReview(shift.id, { rating, comment });
      const refreshed = await getBusinessShiftWorkerSummary(shift.id);
      setWorkerSummary(refreshed);
      setIsReviewModalOpen(false);
      toast.success("Відгук збережено.");
    } catch (requestError) {
      setReviewError(requestError instanceof Error ? requestError.message : "Не вдалося зберегти відгук.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <>
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
                  <Link to={`/companies/${shift.Location.Company.id}`} className="text-sm text-text-muted transition-colors hover:text-accent-text hover:underline">{companyName}</Link>
                  <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                    {title}
                  </h1>
                  <span className="mt-3 inline-flex rounded-[var(--radius-pill)] bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-text">
                    {shift.Category?.name ?? "Відкрита зміна"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex w-fit items-center gap-1.5 text-sm ${status.className}`}>
                  <BriefcaseBusiness className="h-4 w-4" /> {status.label}
                </span>
                <button
                  type="button"
                  onClick={() => toggleFavorite(shift.id)}
                  aria-pressed={favorite}
                  aria-label={favorite ? "Прибрати зміну з обраного" : "Додати зміну в обране"}
                  className={`inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-[var(--radius-pill)] border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    favorite
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-bg text-text-subtle hover:border-accent hover:text-accent"
                  }`}
                >
                  <Heart className={`h-5 w-5 ${favorite ? "fill-current" : "fill-none"}`} />
                </button>
              </div>
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
              <p className="text-sm text-text-muted">Оплата за зміну</p>
              <p className="mt-1 font-mono text-3xl font-bold tracking-tight text-ink">~{moneyFormatter.format(total)} ₴</p>
              <p className="mt-1 text-xs text-text-subtle">{moneyFormatter.format(hourlyRate)} ₴/год {hasBonus ? `+ бонус ${moneyFormatter.format(bonusRate)} ₴` : ""}</p>
              <div className="mt-5 border-t border-border pt-5">
                <p className="flex items-center gap-2 text-sm text-text"><CalendarDays className="h-4 w-4 text-text-subtle" /> {formatDate(shift.startTime)}</p>
                <p className="mt-3 flex items-center gap-2 text-sm text-text"><Clock3 className="h-4 w-4 text-text-subtle" /> {formatTime(shift.startTime)} — {formatTime(shift.endTime)}</p>
              </div>
              {canManageShift ? (
                <div className="mt-6 grid gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingShift(true)}
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
                  >
                    <Pencil className="h-4 w-4" /> Редагувати зміну
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBusinessCancelModalOpen(true)}
                    className="flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-pill)] border border-danger/30 px-5 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
                  >
                    Скасувати зміну
                  </button>
                </div>
              ) : canRepeatShift ? (
                <button
                  type="button"
                  onClick={() => setIsRepeatModalOpen(true)}
                  className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-[var(--radius-pill)] bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
                >
                  Повторити зміну
                </button>
              ) : hasApplied ? (
                <>
                  <p className="mt-6 rounded-[var(--radius-card)] bg-accent/10 px-4 py-3 text-center text-sm font-medium text-accent-text">
                    {activeApplication?.status === "approved"
                      ? "Компанія підтвердила вашу участь"
                      : "Ваш відгук надіслано"}
                  </p>
                  {new Date(shift.startTime) > new Date() && (
                    <button
                      type="button"
                      onClick={() => setIsCancelModalOpen(true)}
                      disabled={isCancellingApplication}
                      className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-pill)] border border-danger/30 px-5 text-sm font-semibold text-danger transition-colors hover:bg-danger/10 disabled:cursor-wait disabled:opacity-60"
                    >
                      {isCancellingApplication ? "Відкликаємо відгук…" : "Відкликати відгук"}
                    </button>
                  )}
                </>
              ) : canApply ? (
                <>
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={isApplying || isCheckingApplication}
                    className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-[var(--radius-pill)] bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {isCheckingApplication ? "Перевіряємо заявку…" : isApplying ? "Надсилаємо відгук…" : "Відгукнутися на зміну"}
                  </button>
                  <p className="mt-3 text-center text-xs leading-5 text-text-subtle">Після відгуку компанія підтвердить вашу участь.</p>
                  {applicationError && <p className="mt-2 text-center text-xs text-danger">{applicationError}</p>}
                </>
              ) : (
                <p className="mt-6 rounded-[var(--radius-card)] bg-bg-muted px-4 py-3 text-center text-sm font-medium text-text-muted">
                  {isShiftFinished
                    ? "Зміна вже завершилася"
                    : isShiftStarted
                      ? "Зміна вже розпочалася"
                      : status.label}
                </p>
              )}
              {isShiftOwner && workerSummary && (() => {
                const profile = workerSummary.application.User.WorkerProfile;
                const workerName = profile ? `${profile.firstName} ${profile.lastName}` : "Виконавець";
                const avatar = profile?.avatarUrl ?? workerSummary.application.User.avatar;
                const isNoShow = workerSummary.application.status === "no_show";
                return (
                  <div className="mt-5 border-t border-border pt-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-text-subtle">{isNoShow ? "Статус виконавця" : "Виконавець зміни"}</p>
                    <div className="mt-3 flex items-center gap-3">
                      {avatar ? <img src={avatar} alt="" className="h-11 w-11 rounded-full object-cover" /> : <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 font-heading font-semibold text-accent">{workerName.charAt(0)}</span>}
                      <div className="min-w-0">
                        <Link to={`/workers/${workerSummary.application.User.id}`} className="block truncate text-sm font-semibold text-ink transition-colors hover:text-accent-text hover:underline">{workerName}</Link>
                        <p className="mt-0.5 text-xs text-text-muted">{isNoShow ? "Не з’явився на зміну" : Number(profile?.rating) > 0 ? `★ ${Number(profile?.rating).toFixed(1)}` : "Ще немає відгуків"}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => { setReviewError(null); setIsReviewModalOpen(true); }} className="mt-4 flex min-h-[42px] w-full items-center justify-center rounded-[var(--radius-pill)] border border-border px-4 text-sm font-medium text-text transition-colors hover:border-accent hover:text-accent-text">
                      {workerSummary.review ? "Редагувати відгук" : "Залишити відгук"}
                    </button>
                  </div>
                );
              })()}
            </div>
          </aside>
        </div>
      </div>
    </main>
    <Modal
      isOpen={isCancelModalOpen}
      onClose={() => setIsCancelModalOpen(false)}
      title="Відкликати відгук?"
    >
      <p className="text-sm leading-6 text-text-muted">
        Компанія більше не розглядатиме вашу заявку на цю зміну. Ви зможете відгукнутися повторно, якщо вакансія залишиться відкритою.
      </p>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => setIsCancelModalOpen(false)}
          disabled={isCancellingApplication}
          className="min-h-[44px] rounded-[var(--radius-pill)] border border-border px-5 text-sm font-semibold text-text transition-colors hover:border-accent disabled:opacity-60"
        >
          Залишити відгук
        </button>
        <button
          type="button"
          onClick={handleCancelApplication}
          disabled={isCancellingApplication}
          className="min-h-[44px] rounded-[var(--radius-pill)] bg-danger px-5 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          {isCancellingApplication ? "Відкликаємо…" : "Відкликати"}
        </button>
      </div>
    </Modal>
    {isShiftOwner && (
      <CreateShiftModal
        isOpen={isEditingShift}
        companyId={shift.Location.Company.id}
        locations={detailLocations}
        isSubmitting={isSavingBusinessShift}
        onClose={() => { if (!isSavingBusinessShift) setIsEditingShift(false); }}
        onSubmit={handleEditShift}
        onLocationCreated={async () => undefined}
        initialShift={shift as BusinessShift}
      />
    )}
    <ReviewModal
      isOpen={isReviewModalOpen}
      onClose={() => { if (!isSubmittingReview) setIsReviewModalOpen(false); }}
      title={workerSummary?.application.status === "no_show" ? "Відгук про неявку" : "Оцініть виконавця"}
      description={workerSummary?.application.status === "no_show" ? "Залиште відгук, щоб інші компанії бачили історію співпраці." : "Як пройшла зміна з виконавцем?"}
      isSubmitting={isSubmittingReview}
      error={reviewError}
      initialReview={workerSummary?.review}
      onSubmit={handleReviewSubmit}
    />
    {isShiftOwner && (
      <CreateShiftModal
        isOpen={isRepeatModalOpen}
        companyId={shift.Location.Company.id}
        locations={detailLocations}
        isSubmitting={isRepeatingShift}
        onClose={() => { if (!isRepeatingShift) setIsRepeatModalOpen(false); }}
        onSubmit={handleRepeatShift}
        onLocationCreated={async () => undefined}
        initialShift={shift as BusinessShift}
        isDuplicate
      />
    )}
    <Modal
      isOpen={isBusinessCancelModalOpen}
      onClose={() => { if (!isCancellingBusinessShift) setIsBusinessCancelModalOpen(false); }}
      title="Скасувати зміну?"
    >
      <p className="text-sm leading-6 text-text-muted">
        Усі заявки виконавців на цю зміну буде відхилено. Повернути зміну після скасування не вийде.
      </p>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={() => setIsBusinessCancelModalOpen(false)} disabled={isCancellingBusinessShift} className="min-h-[44px] rounded-[var(--radius-pill)] border border-border px-5 text-sm font-semibold text-text transition-colors hover:border-accent">Не скасовувати</button>
        <button type="button" onClick={handleBusinessCancel} disabled={isCancellingBusinessShift} className="min-h-[44px] rounded-[var(--radius-pill)] bg-danger px-5 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-60">
          {isCancellingBusinessShift ? "Скасовуємо…" : "Скасувати зміну"}
        </button>
      </div>
    </Modal>
    </>
  );
}

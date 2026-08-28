import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Building2, CalendarDays, Clock3, Heart, MapPin, Phone, Star } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  getPublicCompanyOpenShifts,
  getPublicCompanyProfile,
  type PublicCompanyOpenShiftsResponse,
  type PublicCompanyProfile,
} from "../../api/publicProfiles";
import { ProfileReviewsSection } from "../../components/reviews/ProfileReviewsSection";
import { Loader } from "../../components/ui/Loader";
import { useFavoriteCompanies } from "../../hooks/useFavoriteCompanies";
import { selectIsLoggedIn, selectUserInfo } from "../../redux/auth/selectors";
import { useAppSelector } from "../../redux/hooks";
import {
  formatPriceLabel,
  formatShiftDate,
  formatTimeRange,
} from "../../sectionsHero/TasksBoard/formatters";
import NotFoundPage from "../NotFoundPage";

export default function PublicCompanyProfilePage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsLoggedIn);
  const user = useAppSelector(selectUserInfo);
  const { isFavorite, toggleFavorite } = useFavoriteCompanies();
  const parsedCompanyId = Number(companyId);
  const [company, setCompany] = useState<PublicCompanyProfile | null>(null);
  const [openShifts, setOpenShifts] = useState<PublicCompanyOpenShiftsResponse | null>(null);
  const [shiftsPage, setShiftsPage] = useState(1);
  const [isShiftsLoading, setIsShiftsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isInteger(parsedCompanyId) || parsedCompanyId < 1) {
      setIsLoading(false);
      setError("Некоректне посилання на профіль компанії.");
      return;
    }

    let cancelled = false;
    // При переході між профілями не зберігаємо сторінку пагінації попередньої компанії.
    setShiftsPage(1);
    setIsLoading(true);
    setError(null);

    void getPublicCompanyProfile(parsedCompanyId)
      .then((data) => { if (!cancelled) setCompany(data); })
      .catch(() => { if (!cancelled) setError("Профіль компанії не знайдено."); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [parsedCompanyId]);

  useEffect(() => {
    if (!Number.isInteger(parsedCompanyId) || parsedCompanyId < 1) return undefined;

    let cancelled = false;
    setIsShiftsLoading(true);

    void getPublicCompanyOpenShifts(parsedCompanyId, shiftsPage)
      .then((data) => { if (!cancelled) setOpenShifts(data); })
      // Профіль має залишатися доступним, навіть якщо блок змін тимчасово не завантажився.
      .catch(() => { if (!cancelled) setOpenShifts(null); })
      .finally(() => { if (!cancelled) setIsShiftsLoading(false); });

    return () => { cancelled = true; };
  }, [parsedCompanyId, shiftsPage]);

  if (isLoading) return <Loader fullScreen label="Завантажуємо профіль компанії…" />;
  if (error || !company) return <NotFoundPage title="Профіль не знайдено" description={error ?? undefined} />;

  const favorite = isFavorite(company.id);

  const goBack = () => {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate("/#zavdannia", { replace: true });
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-[var(--space-section)] sm:px-6 md:px-8">
      <button type="button" onClick={goBack} className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-accent-text">
        <ArrowLeft className="h-4 w-4" /> Назад
      </button>

      <section className="mt-6 rounded-[var(--radius-card)] border border-border bg-bg p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {company.avatar ? (
            <img src={company.avatar} alt="" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-2xl font-semibold text-accent">
              {company.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm text-text-muted"><Building2 className="h-4 w-4 text-accent" /> Компанія</p>
            <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight sm:text-3xl">{company.name}</h1>
            <p className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-warning">
              <Star className="h-4 w-4 fill-current" />
              {company.rating > 0 ? `${company.rating.toFixed(2)} / 5` : "Ще немає оцінок"}
            </p>
          </div>
          {isAuthenticated && user?.role === "worker" && (
            <button
              type="button"
              onClick={() => toggleFavorite(company.id)}
              aria-pressed={favorite}
              className={`inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-[var(--radius-pill)] border px-4 text-sm font-medium transition-colors ${
                favorite
                  ? "border-accent bg-accent/10 text-accent-text"
                  : "border-border text-text hover:border-accent hover:text-accent-text"
              }`}
            >
              <Heart className={`h-5 w-5 ${favorite ? "fill-current" : "fill-none"}`} />
              {favorite ? "В улюблених" : "Додати в улюблені"}
            </button>
          )}
        </div>

        <div className="mt-7 border-t border-border pt-5">
          <h2 className="font-heading text-lg font-semibold">Про компанію</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-text-muted">
            {company.description || "Компанія ще не додала опис."}
          </p>
        </div>

        {isAuthenticated && company.Owner?.phone && (
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-xs font-medium text-text-muted">Контактний телефон</p>
            <a href={`tel:${company.Owner.phone}`} className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-accent-text transition-colors hover:text-accent hover:underline">
              <Phone className="h-4 w-4" /> {company.Owner.phone}
            </a>
          </div>
        )}

        {company.Locations.length > 0 && (
          <div className="mt-7 border-t border-border pt-5">
            <h2 className="font-heading text-lg font-semibold">Робочі локації</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {company.Locations.map((location) => (
                <article key={location.id} className="rounded-[var(--radius-card)] border border-border bg-bg-muted p-4">
                  <p className="font-medium text-ink">{location.title}</p>
                  <p className="mt-2 flex gap-2 text-sm leading-5 text-text-muted"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{location.address}, {location.city}</p>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-[var(--radius-card)] border border-border bg-bg p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="font-heading text-xl font-semibold">Відкриті зміни</h2>
            {openShifts && (
              <p className="mt-1 text-sm text-text-muted">
                {openShifts.totalItems
                  ? `Доступно: ${openShifts.totalItems}`
                  : "Наразі нових змін немає"}
              </p>
            )}
          </div>
        </div>

        {isShiftsLoading && !openShifts ? (
          <div className="py-8"><Loader label="Завантажуємо відкриті зміни…" /></div>
        ) : openShifts?.data.length ? (
          <>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {openShifts.data.map((shift) => (
                <article key={shift.id} className="flex flex-col rounded-[var(--radius-card)] border border-border bg-bg-muted p-4">
                  <p className="font-heading text-base font-semibold leading-6 text-ink">
                    {shift.JobPosition?.title ?? "Відкрита зміна"}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-text-muted">
                    <CalendarDays className="h-4 w-4 text-accent" />
                    {formatShiftDate(shift.startTime)}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-text-muted">
                    <Clock3 className="h-4 w-4 text-accent" />
                    {formatTimeRange(shift.startTime, shift.endTime)}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-text-muted">
                    <MapPin className="h-4 w-4 text-accent" />
                    {shift.Location?.title}, {shift.Location?.city}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
                    <span className="font-mono text-lg font-medium text-accent">
                      {formatPriceLabel(shift)}
                    </span>
                    <Link
                      to={`/shifts/${shift.id}`}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-[var(--radius-pill)] border border-ink px-4 text-sm font-medium text-ink transition-colors hover:border-accent hover:bg-accent hover:text-white"
                    >
                      Детальніше <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {openShifts.totalPages > 1 && (
              <div className="mt-5 flex items-center justify-center gap-3">
                <button type="button" disabled={shiftsPage === 1 || isShiftsLoading} onClick={() => setShiftsPage((page) => page - 1)} className="min-h-[40px] rounded-[var(--radius-pill)] border border-border px-4 text-sm text-text transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-45">Назад</button>
                <span className="text-sm text-text-muted">{openShifts.currentPage} / {openShifts.totalPages}</span>
                <button type="button" disabled={shiftsPage === openShifts.totalPages || isShiftsLoading} onClick={() => setShiftsPage((page) => page + 1)} className="min-h-[40px] rounded-[var(--radius-pill)] border border-border px-4 text-sm text-text transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-45">Далі</button>
              </div>
            )}
          </>
        ) : !isShiftsLoading ? (
          <p className="mt-5 rounded-[var(--radius-card)] bg-bg-muted px-4 py-5 text-center text-sm text-text-muted">
            Наразі компанія не має доступних змін.
          </p>
        ) : null}
      </section>

      <ProfileReviewsSection revieweeId={company.ownerId} companyId={company.id} subject="company" />
    </main>
  );
}

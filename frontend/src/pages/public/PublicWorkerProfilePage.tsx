import { useEffect, useState } from "react";
import { ArrowLeft, Phone, Star, UserRound } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { getPublicWorkerProfile, type PublicWorkerProfile } from "../../api/publicProfiles";
import { ProfileReviewsSection } from "../../components/reviews/ProfileReviewsSection";
import { Loader } from "../../components/ui/Loader";
import { selectIsLoggedIn } from "../../redux/auth/selectors";
import { useAppSelector } from "../../redux/hooks";
import NotFoundPage from "../NotFoundPage";

export default function PublicWorkerProfilePage() {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsLoggedIn);
  const parsedWorkerId = Number(workerId);
  const [profile, setProfile] = useState<PublicWorkerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isInteger(parsedWorkerId) || parsedWorkerId < 1) {
      setIsLoading(false);
      setError("Некоректне посилання на профіль виконавця.");
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void getPublicWorkerProfile(parsedWorkerId)
      .then((data) => { if (!cancelled) setProfile(data); })
      .catch(() => { if (!cancelled) setError("Профіль виконавця не знайдено."); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [parsedWorkerId]);

  if (isLoading) return <Loader fullScreen label="Завантажуємо профіль виконавця…" />;
  if (error || !profile) return <NotFoundPage title="Профіль не знайдено" description={error ?? undefined} />;

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const avatar = profile.avatarUrl ?? profile.User?.avatar;
  const rating = Number(profile.rating);
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
          {avatar ? (
            <img src={avatar} alt="" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-2xl font-semibold text-accent">
              {profile.firstName.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm text-text-muted"><UserRound className="h-4 w-4 text-accent" /> Виконавець</p>
            <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight sm:text-3xl">{fullName}</h1>
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted">
              <Star className={`h-4 w-4 ${rating > 0 ? "fill-warning text-warning" : "text-text-subtle"}`} />
              {rating > 0 ? `${rating.toFixed(2)} / 5` : "Ще немає відгуків"}
            </p>
          </div>
        </div>

        <div className="mt-7 border-t border-border pt-5">
          <h2 className="font-heading text-lg font-semibold">Про виконавця</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-text-muted">
            {profile.description || "Виконавець ще не додав опис."}
          </p>
        </div>

        {isAuthenticated && profile.User?.phone && (
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-xs font-medium text-text-muted">Контактний телефон</p>
            <a href={`tel:${profile.User.phone}`} className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-accent-text transition-colors hover:text-accent hover:underline">
              <Phone className="h-4 w-4" /> {profile.User.phone}
            </a>
          </div>
        )}
      </section>

      <ProfileReviewsSection revieweeId={profile.userId} subject="worker" />
    </main>
  );
}

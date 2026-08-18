import { useEffect, useState } from "react";
import { ArrowLeft, Building2, MapPin, Phone } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { getPublicCompanyProfile, type PublicCompanyProfile } from "../../api/publicProfiles";
import { ProfileReviewsSection } from "../../components/reviews/ProfileReviewsSection";
import { Loader } from "../../components/ui/Loader";
import NotFoundPage from "../NotFoundPage";

export default function PublicCompanyProfilePage() {
  const { companyId } = useParams();
  const parsedCompanyId = Number(companyId);
  const [company, setCompany] = useState<PublicCompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isInteger(parsedCompanyId) || parsedCompanyId < 1) {
      setIsLoading(false);
      setError("Некоректне посилання на профіль компанії.");
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void getPublicCompanyProfile(parsedCompanyId)
      .then((data) => { if (!cancelled) setCompany(data); })
      .catch(() => { if (!cancelled) setError("Профіль компанії не знайдено."); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [parsedCompanyId]);

  if (isLoading) return <Loader fullScreen label="Завантажуємо профіль компанії…" />;
  if (error || !company) return <NotFoundPage title="Профіль не знайдено" description={error ?? undefined} />;

  return (
    <main className="mx-auto max-w-4xl px-4 py-[var(--space-section)] sm:px-6 md:px-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-accent-text">
        <ArrowLeft className="h-4 w-4" /> До всіх змін
      </Link>

      <section className="mt-6 rounded-[var(--radius-card)] border border-border bg-bg p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {company.avatar ? (
            <img src={company.avatar} alt="" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-2xl font-semibold text-accent">
              {company.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm text-text-muted"><Building2 className="h-4 w-4 text-accent" /> Компанія</p>
            <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight sm:text-3xl">{company.name}</h1>
          </div>
        </div>

        <div className="mt-7 border-t border-border pt-5">
          <h2 className="font-heading text-lg font-semibold">Про компанію</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-text-muted">
            {company.description || "Компанія ще не додала опис."}
          </p>
        </div>

        {company.Owner?.phone && (
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

      <ProfileReviewsSection revieweeId={company.ownerId} companyId={company.id} subject="company" />
    </main>
  );
}

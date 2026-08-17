import { useEffect, useState } from "react";
import { Building2, MessageSquareText, Star } from "lucide-react";
import { Link } from "react-router-dom";

import { getReceivedReviews, type ReceivedReview } from "../../api/reviews";
import { Loader } from "../../components/ui/Loader";

const REVIEWS_PER_PAGE = 5;

type ReviewSubject = "worker" | "company";

function ReviewCard({ review, subject }: { review: ReceivedReview; subject: ReviewSubject }) {
  const company = review.Shift.Location?.Company;
  const worker = review.Reviewer?.WorkerProfile;
  const isWorkerProfile = subject === "worker";
  const reviewerName = isWorkerProfile
    ? company?.name ?? "Компанії"
    : [worker?.firstName, worker?.lastName].filter(Boolean).join(" ") || "Виконавця";
  const reviewerAvatar = isWorkerProfile ? company?.avatar : worker?.avatarUrl ?? review.Reviewer?.avatar;
  const date = new Date(review.createdAt).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article className="rounded-[var(--radius-card)] border border-border bg-bg p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-text-muted">Відгук від {isWorkerProfile ? "компанії" : "виконавця"}</p>
          <div className="mt-1 flex items-center gap-2 text-sm font-medium text-ink">
            {reviewerAvatar ? (
              <img src={reviewerAvatar} alt="" className="h-5 w-5 shrink-0 rounded-full object-cover" />
            ) : (
              <Building2 className="h-4 w-4 shrink-0 text-accent" />
            )}
            <span className="truncate">{reviewerName}</span>
          </div>
          <p className="mt-1 text-xs text-text-muted">
            <Link
              to={`/shifts/${review.Shift.id}`}
              className="font-medium text-accent-text hover:text-accent hover:underline"
            >
              {review.Shift.JobPosition?.title ?? "Зміна"}
            </Link>
            <span> · {date}</span>
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-sm font-semibold text-warning">
          <Star className="h-3.5 w-3.5 fill-current" />
          {review.rating.toFixed(1)}
        </span>
      </div>
      {review.comment && <p className="mt-4 text-sm leading-6 text-text-muted">{review.comment}</p>}
    </article>
  );
}

function ProfileReviewsSection({
  userId,
  subject,
  companyId,
}: {
  userId: number;
  subject: ReviewSubject;
  companyId?: number;
}) {
  const [reviews, setReviews] = useState<ReceivedReview[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void getReceivedReviews(userId, page, REVIEWS_PER_PAGE, companyId)
      .then((response) => {
        if (cancelled) return;
        setReviews(response.data);
        setTotalItems(response.totalItems);
        setTotalPages(response.totalPages);
        setAverageRating(response.averageRating);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Не вдалося завантажити відгуки.");
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [companyId, page, userId]);

  return (
    <section className="mt-8" aria-labelledby="worker-reviews-title">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 id="worker-reviews-title" className="font-heading text-xl font-semibold">
            {subject === "worker" ? "Відгуки про вас" : "Відгуки про компанію"}
          </h2>
          {totalItems > 0 && (
            <p className="mt-1 flex items-center gap-2 text-sm text-text-muted">
              Усього: {totalItems}
              {subject === "company" && <><span aria-hidden="true">·</span><span className="inline-flex items-center gap-1 font-medium text-warning"><Star className="h-3.5 w-3.5 fill-current" /> {averageRating.toFixed(2)} / 5</span></>}
            </p>
          )}
        </div>
      </div>

      {isLoading ? <Loader label="Завантажуємо відгуки…" size="sm" /> : error ? (
        <p className="rounded-[var(--radius-card)] border border-danger/20 bg-danger/5 p-4 text-sm text-danger">{error}</p>
      ) : reviews.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-border bg-bg px-6 py-10 text-center">
          <MessageSquareText className="mx-auto h-7 w-7 text-accent/80" />
          <p className="mt-3 text-sm text-text-muted">Відгуків поки немає. Вони з’являться після завершених змін.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3">{reviews.map((review) => <ReviewCard key={review.id} review={review} subject={subject} />)}</div>
          {totalPages > 1 && (
            <nav className="mt-6 flex items-center justify-center gap-1.5" aria-label="Сторінки відгуків">
              <button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="min-h-[40px] rounded-[var(--radius-pill)] border border-border px-3 text-sm text-text-muted disabled:cursor-not-allowed disabled:opacity-40">Назад</button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                <button key={number} type="button" onClick={() => setPage(number)} aria-current={page === number ? "page" : undefined} className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-pill)] text-sm font-medium transition-colors ${page === number ? "bg-accent text-white" : "border border-border text-text hover:border-accent"}`}>{number}</button>
              ))}
              <button type="button" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)} className="min-h-[40px] rounded-[var(--radius-pill)] border border-border px-3 text-sm text-text-muted disabled:cursor-not-allowed disabled:opacity-40">Далі</button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}

export function WorkerReviewsSection({ userId }: { userId: number }) {
  return <ProfileReviewsSection userId={userId} subject="worker" />;
}

export function CompanyReviewsSection({ userId, companyId }: { userId: number; companyId: number }) {
  return <ProfileReviewsSection userId={userId} companyId={companyId} subject="company" />;
}

import { useCallback, useEffect, useRef, useState } from "react";
import { getAllShifts, type Shift } from "../../api/shifts";

const PAGE_LIMIT = 20;

export function useInfiniteShifts(scrollContainerRef: React.RefObject<HTMLElement>) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFirstPage() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getAllShifts({ page: 1, limit: PAGE_LIMIT });
        if (cancelled) return;
        setShifts(response.data);
        setPage(1);
        setHasMore(response.currentPage < response.totalPages);
      } catch {
        if (!cancelled) setError("Не вдалося завантажити завдання. Спробуйте пізніше.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadFirstPage();
    return () => {
      cancelled = true;
    };
  }, []);

  // 1. Спершу оголошуємо loadNextPage як завжди
  const loadNextPage = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await getAllShifts({ page: nextPage, limit: PAGE_LIMIT });
      setShifts((prev) => [...prev, ...response.data]);
      setPage(nextPage);
      setHasMore(response.currentPage < response.totalPages);
    } catch {
      setError("Не вдалося завантажити наступну сторінку.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, isLoading, isLoadingMore, hasMore]);

  // 2. Тепер loadNextPage вже існує — можна покласти її в ref
  const loadNextPageRef = useRef(loadNextPage);
  useEffect(() => {
    loadNextPageRef.current = loadNextPage;
  }, [loadNextPage]);

  // 3. sentinelRef більше НЕ залежить від loadNextPage — тільки від scrollContainerRef,
  // тож обсервер не перестворюється на кожну зміну стейту пагінації
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      observerRef.current?.disconnect();
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) loadNextPageRef.current();
        },
        { root: scrollContainerRef.current, rootMargin: "120px" },
      );
      observerRef.current.observe(node);
    },
    [scrollContainerRef],
  );

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { shifts, isLoading, isLoadingMore, error, hasMore, sentinelRef };
}